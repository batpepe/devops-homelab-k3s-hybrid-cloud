// Playwright config for the smoke test. The container under test is started by CI
// (docker run -p 8080:80); BASE_URL points the test at it. autoplay-policy avoids a
// headless audio gesture warning when the game resumes its AudioContext on click.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  reporter: 'line',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    headless: true,
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
});
