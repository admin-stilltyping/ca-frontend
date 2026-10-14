# ca-frontend: Reel DM Automation dashboard

React dashboard for **Reel DM Automation**: when someone comments a keyword (like `link`) on your
Instagram reel, they automatically get your DM. The API lives in
[ca-backend](https://github.com/admin-stilltyping/ca-backend).

- **Log in with Instagram**
- **Create automations**: pick a reel or all reels, enter keywords, write the DM with a live preview,
  and optionally add a public reply.
- **Manage automations**: pause, edit or delete.
- **Test a comment**: see what would be sent, without sending anything.
- **Activity and stats**: an activity log (refreshes every 30 s), DMs sent and failures.
- **Required pages**: privacy policy and data-deletion pages, needed for Meta App Review.
- Works on mobile and in dark mode.

## Stack

React 19 · TypeScript · Vite · Vitest + Testing Library · Playwright

## How it talks to the backend

The browser only ever talks to the frontend's own domain:

- **Local dev:** Vite forwards `/api`, `/auth`, `/webhook` to `http://localhost:8000` (set `BACKEND_URL` to change).
- **Production (Netlify):** `npm run build` writes `dist/_redirects`, which makes Netlify forward the same
  paths to `BACKEND_URL`.

Because of this, the login cookie is first-party and works in every browser. No CORS is needed.

## Run locally

```bash
npm install
npm run dev            # http://localhost:5173, needs ca-backend running on :8000
ngrok http 5173        # Instagram needs HTTPS: put this URL in ca-backend's BASE_URL and open it
```

## Deploy free on Netlify

1. **Add new site → Import from Git →** this repo. [`netlify.toml`](netlify.toml) sets the build.
2. **Site settings → Environment variables:** set `BACKEND_URL` = your ca-backend URL
   (e.g. `https://ca-backend.onrender.com`) and redeploy.
3. Use the Netlify URL as ca-backend's `BASE_URL`, and in the Meta app settings (see ca-backend's README).

## Tests

```bash
npm run typecheck
npm test                     # 27 component tests

# End-to-end: real ca-backend + real browser, Instagram faked (desktop + mobile, 12 tests)
git clone https://github.com/admin-stilltyping/ca-backend ../ca-backend
pip install -r ../ca-backend/requirements.txt
npx playwright install chromium
npm run test:e2e             # BACKEND_DIR / PYTHON env vars override paths
```

The E2E tests log in, create an automation for a reel, send signed Instagram webhooks, check exactly
one DM is sent, then pause, edit and delete. CI runs everything on every push. If ca-backend is
private, add a `BACKEND_REPO_TOKEN` secret so CI can check it out.

## Layout

```
src/
  App.tsx              login / dashboard / privacy / deletion
  api.ts, types.ts     typed API client
  components/          Dashboard, RuleForm, MediaPicker, RuleList, CommentTester, ActivityLog, LegalPages
e2e/app.spec.ts        Playwright tests
scripts/write-redirects.mjs   Netlify proxy rules
```
