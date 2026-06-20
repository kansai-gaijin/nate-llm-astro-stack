import { expect, test } from '@playwright/test';

test.describe('Japanese typography', () => {
	test('document declares the Japanese locale', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
	});

	test('body enforces kinsoku line-break rules', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		const lineBreak = await page.evaluate(() => getComputedStyle(document.body).lineBreak);
		expect(lineBreak).toBe('strict');
	});

	test('JpText breaks only at BudouX phrase boundaries', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		const phrase = page.locator('.jp-phrase').first();
		await expect(phrase).toBeVisible();

		// BudouX inserts <wbr> between phrases (文節) so kanji compounds never split mid-word.
		const wbrCount = await phrase.locator('wbr').count();
		expect(wbrCount).toBeGreaterThan(0);

		// keep-all means the browser may break ONLY at those inserted <wbr> opportunities,
		// guaranteeing sensible breaks even where word-break: auto-phrase is unsupported.
		const wordBreak = await phrase.evaluate((element) => getComputedStyle(element).wordBreak);
		expect(wordBreak).toBe('keep-all');
	});
});
