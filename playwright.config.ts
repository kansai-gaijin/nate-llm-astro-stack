import { defineConfig } from '@playwright/test';

const port = Number(process.env.LOOP_TEST_PORT ?? 4321);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	workers: process.env.CI ? 2 : 1,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	outputDir: 'artifacts/test-results',
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	webServer: {
		command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
