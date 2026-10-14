import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jsonError, mockApi, reel, rule } from '../test-utils';
import RuleForm from './RuleForm';

function setup(props: Partial<React.ComponentProps<typeof RuleForm>> = {}) {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <RuleForm
      media={[reel('reel1', 'Morning routine'), reel('reel2')]}
      mediaLoading={false}
      mediaError={null}
      editing={null}
      onSaved={onSaved}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSaved, onCancel, user: userEvent.setup() };
}

it('creates an automation for a specific reel', async () => {
  const api = mockApi({ 'POST /api/rules': (body: unknown) => rule(body as object) });
  const { onSaved, user } = setup();

  await user.click(screen.getByRole('radio', { name: /Morning routine/ }));
  await user.type(screen.getByLabelText('Keywords'), 'link, guide');
  await user.type(screen.getByLabelText('3. Send them this DM'), 'Hey {{username}! https://x.co');
  await user.type(screen.getByLabelText(/Also reply publicly/), 'Check DMs');
  await user.type(screen.getByLabelText(/Name/), 'Morning');
  await user.click(screen.getByRole('button', { name: 'Create automation' }));

  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(api.calls[0].body).toEqual({
    name: 'Morning',
    media_id: 'reel1',
    media_label: expect.stringContaining('Reel ·'),
    media_thumbnail_url: 'https://cdn.test/reel1.jpg',
    match_type: 'contains',
    keywords: 'link, guide',
    dm_message: 'Hey {username}! https://x.co',
    public_reply: 'Check DMs',
  });
  // Form resets after saving
  expect(screen.getByLabelText('Keywords')).toHaveValue('');
  expect(screen.getByRole('radio', { name: /All reels/ })).toBeChecked();
});

it('shows a live DM preview with the username filled in', async () => {
  const { user } = setup();
  await user.type(screen.getByLabelText('3. Send them this DM'), 'Hi {{username}');
  expect(screen.getByLabelText('DM preview')).toHaveTextContent('Hi @your_follower');
  expect(screen.getByText('13/1000')).toBeInTheDocument();
});

it('validates before calling the API', async () => {
  const api = mockApi({});
  const { user } = setup();
  await user.click(screen.getByRole('button', { name: 'Create automation' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Add at least one keyword');
  await user.type(screen.getByLabelText('Keywords'), 'link');
  await user.click(screen.getByRole('button', { name: 'Create automation' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Write the DM');
  expect(api.calls).toHaveLength(0);
});

it('"anything" hides keywords and needs none', async () => {
  const api = mockApi({ 'POST /api/rules': rule() });
  const { user, onSaved } = setup();
  await user.selectOptions(screen.getByLabelText('2. When someone comments…'), 'any');
  expect(screen.queryByLabelText('Keywords')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('3. Send them this DM'), 'Thanks!');
  await user.click(screen.getByRole('button', { name: 'Create automation' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(api.calls[0].body).toMatchObject({ match_type: 'any', media_id: null });
});

it('shows server errors', async () => {
  mockApi({ 'POST /api/rules': jsonError(422, 'dm_message: too long') });
  const { user, onSaved } = setup();
  await user.type(screen.getByLabelText('Keywords'), 'link');
  await user.type(screen.getByLabelText('3. Send them this DM'), 'hi');
  await user.click(screen.getByRole('button', { name: 'Create automation' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('dm_message: too long');
  expect(onSaved).not.toHaveBeenCalled();
});

it('edits an existing automation', async () => {
  const existing = rule({ media_id: 'reel2', media_label: 'Reel 2', match_type: 'exact' });
  const api = mockApi({ 'PUT /api/rules/r1': rule() });
  const { user, onSaved, onCancel } = setup({ editing: existing });

  expect(screen.getByRole('heading', { name: 'Edit automation' })).toBeInTheDocument();
  expect(screen.getByLabelText('Keywords')).toHaveValue('link, guide');
  expect(screen.getByLabelText('2. When someone comments…')).toHaveValue('exact');
  expect(screen.getByRole('radio', { name: /Caption reel2/ })).toBeChecked();

  await user.clear(screen.getByLabelText('Keywords'));
  await user.type(screen.getByLabelText('Keywords'), 'info');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(api.calls[0]).toMatchObject({ method: 'PUT', body: { keywords: 'info', media_id: 'reel2' } });

  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalled();
});

it('shows media loading and error states', () => {
  setup({ media: [], mediaLoading: true });
  expect(screen.getByText('Loading your reels…')).toBeInTheDocument();
});
