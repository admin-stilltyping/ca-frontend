// Writes dist/_redirects for Netlify: the browser only ever talks to the frontend's domain,
// and Netlify forwards API/login/webhook calls to ca-backend. Same origin = the login cookie works.
//   BACKEND_URL=https://ca-backend.onrender.com npm run build
import { writeFileSync } from 'node:fs';

const backend = (process.env.BACKEND_URL ?? '').replace(/\/+$/, '');
const rules = [];
if (backend) {
  for (const path of ['/api/*', '/auth/*']) {
    rules.push(`${path}  ${backend}${path.replace('*', ':splat')}  200`);
  }
  rules.push(`/webhook  ${backend}/webhook  200`, `/healthz  ${backend}/healthz  200`);
} else {
  // Vite has already copied public/_redirects into dist. Overwriting it with a bare SPA
  // fallback would take the API proxy off the deployed site, so leave it in place.
  console.warn('BACKEND_URL not set: keeping the committed public/_redirects.');
  process.exit(0);
}
rules.push('/*  /index.html  200');
writeFileSync(new URL('../dist/_redirects', import.meta.url), rules.join('\n') + '\n');
