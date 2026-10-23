import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const backendDir = path.resolve(__dirname, '../backend');
const frontendDir = path.resolve(__dirname, '../frontend');

const pythonCandidates = [ // looks for python venvs on windows and linux filesystems
  path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
  path.join(backendDir, '.venv', 'bin', 'python'),
  path.join(backendDir, 'finanzmoench', 'Scripts', 'python.exe'),
  path.join(backendDir, 'finanzmoench', 'bin', 'python'),
];
const python = process.env.E2E_PYTHON ?? pythonCandidates.find((p) => fs.existsSync(p)) ?? 'python';
const py = `"${python}"`;

const djangoEnv = {
  DJANGO_SETTINGS_MODULE: 'config.settings_e2e',
  SECRET_KEY_BE: process.env.SECRET_KEY_BE ?? 'e2e-secret-key-nur-fuer-lokale-tests',
  DEBUG: '1',
  PYTHONUTF8: '1', //pythonutf8 needed for windows console window
};

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
  ],

  webServer: [
    {
      command: [
        `${py} manage.py migrate --noinput`,
        `${py} manage.py flush --noinput`, //db is emptied so that every run starts clear
        `${py} manage.py seed_e2e`,
        `${py} manage.py runserver 8000 --noreload`,
      ].join(' && '),
      cwd: backendDir,
      url: 'http://127.0.0.1:8000/api/flags/', // health check, this endpoint should always respond even without login
      env: djangoEnv,
      reuseExistingServer: false, // dont flush running dev servers
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      cwd: frontendDir,
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
