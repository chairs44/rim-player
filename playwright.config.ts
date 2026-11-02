import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:5178' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5178', reuseExistingServer: !process.env.CI },
  reporter: 'list',
});
