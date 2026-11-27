import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', testMatch: '**/*.spec.js', use: { baseURL: 'http://localhost:1420', launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] } }, webServer: { command: 'npm run dev', url: 'http://localhost:1420', reuseExistingServer: !process.env.CI } });
