// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Admin e2e tests read ADMIN_EMAIL / ADMIN_PASSWORD from the local env file.
require('dotenv').config({ path: '.env.local', quiet: true });

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run build && npx next start -p 4173 -H 127.0.0.1',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: true,
    timeout: 300_000,
    stderr: 'ignore'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /admin\.spec\.js/ }
  ]
});
