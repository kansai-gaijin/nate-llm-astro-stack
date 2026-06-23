import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const contentMap = JSON.parse(fs.readFileSync(path.resolve('workflow/content-map.json'), 'utf8')) as {
	status: string;
	entries: Array<{ id: string; route: string; selector: string; text: string }>;
};
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

test.describe('approved content coverage', () => {
	test.skip(contentMap.status !== 'mapped', 'Content adaptation has not produced a locked map yet.');
	for (const entry of contentMap.entries ?? []) {
		test(`${entry.id} renders on ${entry.route}`, async ({ page }) => {
			await page.goto(entry.route);
			const text = normalize(await page.locator(entry.selector).allTextContents().then((values) => values.join(' ')));
			expect(text).toContain(normalize(entry.text));
		});
	}
});
