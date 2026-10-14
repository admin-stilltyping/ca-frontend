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
  console.warn('BACKEND_URL not set: dist/_redirects will only contain the SPA fallback.');
}
rules.push('/*  /index.html  200');
writeFileSync(new URL('../dist/_redirects', import.meta.url), rules.join('\n') + '\n');
