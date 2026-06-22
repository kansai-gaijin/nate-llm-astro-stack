import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import matter from 'gray-matter';

const overview = matter(
	fs.readFileSync(path.resolve('content', 'overview.md'), 'utf8'),
).data as { pages: Array<{ path: string; title?: string }> };

const viewports = [
	{ name: 'desktop-1920', width: 1920, height: 1080 },
	{ name: 'desktop-1440', width: 1440, height: 1000 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'mobile-390', width: 390, height: 844 },
	{ name: 'mobile-360', width: 360, height: 800 },
];

for (const pageDefinition of overview.pages) {
	for (const viewport of viewports) {
		test(`${pageDefinition.path} renders at ${viewport.name}`, async ({ page }) => {
			const errors: string[] = [];
			page.on('console', (message) => {
				if (['error', 'warning', 'warn'].includes(message.type())) errors.push(message.text());
			});
			page.on('pageerror', (error) => errors.push(error.message));
			await page.setViewportSize(viewport);
			await page.goto(pageDefinition.path, { waitUntil: 'networkidle' });
			await expect(page.locator('main')).toBeVisible();
			await expect(page).toHaveTitle(/.+/);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow).toBeLessThanOrEqual(1);
			expect(errors).toEqual([]);
		});
	}

	test(`${pageDefinition.path} has no serious accessibility violations`, async ({ page }) => {
		await page.goto(pageDefinition.path, { waitUntil: 'networkidle' });
		const results = await new AxeBuilder({ page }).analyze();
		const blocking = results.violations.filter((violation) =>
			['serious', 'critical'].includes(violation.impact ?? ''),
		);
		expect(blocking).toEqual([]);
	});
}
