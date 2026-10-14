import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Runs the real ca-backend (with a fake Instagram) serving the built React app.
// Expects ca-backend checked out next to this repo, or set BACKEND_DIR.
const backendDir = path.resolve(import.meta.dirname, process.env.BACKEND_DIR ?? '../ca-backend');
const python =
  process.env.PYTHON ??
  [path.join(backendDir, '.venv/bin/python'), path.join(backendDir, '.venv/Scripts/python.exe')].find(existsSync) ??
  'python';
const port = Number(process.env.E2E_PORT ?? 8765);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `"${python}" tests/e2e_server.py`,
    cwd: backendDir,
    url: `http://127.0.0.1:${port}/healthz`,
    reuseExistingServer: false,
    env: { E2E_PORT: String(port), FRONTEND_DIST: path.resolve(import.meta.dirname, 'dist') },
  },
});
