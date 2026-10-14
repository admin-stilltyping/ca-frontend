import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createHmac, randomUUID } from 'node:crypto';

// Must match backend/tests/e2e_server.py and fake_instagram.py
const WEBHOOK_SECRET = 'e2e-app-secret';
const IG_USER_ID = '17841499999999999';

async function login(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Log in with Instagram' }).click();
  await expect(page.getByText('@demo.creator')).toBeVisible();
}

async function deleteAllRules(request: APIRequestContext) {
  const rules = await (await request.get('/api/rules')).json();
  for (const rule of rules) await request.delete(`/api/rules/${rule.id}`);
}

/** Sends a signed "comments" webhook exactly like Instagram would. */
async function comment(request: APIRequestContext, opts: { id: string; text: string; username: string; media: string }) {
  const body = JSON.stringify({
    object: 'instagram',
    entry: [
      {
        id: IG_USER_ID,
        time: Date.now(),
        changes: [
          {
            field: 'comments',
            value: {
              id: opts.id,
              text: opts.text,
              from: { id: `user-${opts.username}`, username: opts.username },
              media: { id: opts.media, media_product_type: 'REELS' },
            },
          },
        ],
      },
    ],
  });
  const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
  const res = await request.post('/webhook', {
    data: body,
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
  });
  expect(res.status()).toBe(200);
}

async function sentDms(request: APIRequestContext, commentId: string) {
  const sent = await (await request.get('/__fake__/sent')).json();
  return sent.dms.filter((d: { comment_id: string }) => d.comment_id === commentId);
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await deleteAllRules(page.request);
  await page.reload();
  await expect(page.getByText(/No automations yet/)).toBeVisible();
});

test('full flow: create automation, comment, receive DM, pause, edit, delete', async ({ page }) => {
  const run = randomUUID().slice(0, 8);

  // 1. Create an automation for one reel
  await page.getByRole('radio', { name: /Free budget template/ }).click();
  await page.getByLabel('Keywords').fill('budget, link');
  await page.getByLabel('3. Send them this DM').fill("Hey {username}! Here's the template: https://example.com/budget");
  await expect(page.getByLabel('DM preview')).toContainText('Hey @your_follower!');
  await page.getByLabel(/Also reply publicly/).fill('Sent! Check your DMs 📩');
  await page.getByLabel(/^Name/).fill('Budget reel');
  await page.getByRole('button', { name: 'Create automation' }).click();

  const rule = page.getByRole('listitem', { name: 'Budget reel' });
  await expect(rule).toBeVisible();
  await expect(rule).toContainText('Free budget template');
  await expect(rule.getByText('budget', { exact: true })).toBeVisible();

  // 2. Dry-run the comment tester (the automation only covers reel1)
  await page.getByLabel('Reel to test').selectOption('reel1');
  await page.getByLabel('Comment text').fill('BUDGET pls 🙏');
  await page.getByRole('button', { name: 'Test', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Matches Budget reel');
  await page.getByLabel('Comment text').fill('nice video');
  await page.getByRole('button', { name: 'Test', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No automation matches');
  await page.getByLabel('Reel to test').selectOption('');
  await page.getByLabel('Comment text').fill('budget');
  await page.getByRole('button', { name: 'Test', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No automation matches');

  // 3. A follower comments on the reel -> they get the DM, once
  const c1 = `c1-${run}`;
  await comment(page.request, { id: c1, text: 'Budget please!!', username: 'fan_42', media: 'reel1' });
  await expect.poll(() => sentDms(page.request, c1)).toEqual([
    { comment_id: c1, text: "Hey @fan_42! Here's the template: https://example.com/budget" },
  ]);
  await comment(page.request, { id: c1, text: 'Budget please!!', username: 'fan_42', media: 'reel1' });

  await page.getByRole('button', { name: 'Refresh' }).click();
  await expect(page.getByText('@fan_42')).toBeVisible();
  await expect(page.locator('.pill-sent').first()).toHaveText('Sent');
  await expect(rule).toContainText('1 DM sent');
  expect(await sentDms(page.request, c1)).toHaveLength(1);

  // Comments on other reels or without the keyword are ignored
  const c2 = `c2-${run}`;
  const c3 = `c3-${run}`;
  await comment(page.request, { id: c2, text: 'budget', username: 'fan_43', media: 'reel2' });
  await comment(page.request, { id: c3, text: 'love this', username: 'fan_44', media: 'reel1' });

  // 4. Pause -> no DM
  await rule.getByRole('button', { name: 'Pause' }).click();
  await expect(rule.getByText('Paused')).toBeVisible();
  const c4 = `c4-${run}`;
  await comment(page.request, { id: c4, text: 'link', username: 'fan_45', media: 'reel1' });

  // 5. Resume + edit to "all reels" -> comments on any reel work
  await rule.getByRole('button', { name: 'Resume' }).click();
  await rule.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('heading', { name: 'Edit automation' })).toBeVisible();
  await page.getByRole('radio', { name: /All reels/ }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'New automation' })).toBeVisible();
  await expect(rule).toContainText('All reels & posts');
  const c5 = `c5-${run}`;
  await comment(page.request, { id: c5, text: 'LINK', username: 'fan_46', media: 'reel3' });
  await expect.poll(async () => (await sentDms(page.request, c5)).length).toBe(1);

  for (const id of [c2, c3, c4]) expect(await sentDms(page.request, id)).toHaveLength(0);

  // 6. Delete
  page.once('dialog', (d) => d.accept());
  await rule.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText(/No automations yet/)).toBeVisible();
});

test('validation errors are shown in the form', async ({ page }) => {
  await page.getByRole('button', { name: 'Create automation' }).click();
  await expect(page.getByRole('alert')).toContainText('Add at least one keyword');
});

test('log out and back in', async ({ page }) => {
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('link', { name: 'Log in with Instagram' })).toBeVisible();
  expect((await page.request.get('/api/me')).status()).toBe(401);
  await login(page);
});

test('a forged login callback is rejected', async ({ page }) => {
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/auth/instagram/callback?code=fake-code&state=forged');
  await expect(page.getByRole('alert')).toContainText('Login expired');
  await expect(page.getByRole('link', { name: 'Log in with Instagram' })).toBeVisible();
});

test('privacy policy page is public', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible();
});

test('no horizontal scrolling', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
