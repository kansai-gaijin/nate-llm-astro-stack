import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const plan = JSON.parse(fs.readFileSync(path.resolve('workflow', 'reference-plan.json'), 'utf8'));

async function runAction(page: Page, action: Record<string, unknown>) {
	const selector = (action.implementationSelector ?? action.selector) as string | undefined;
	if (action.type === 'hover' && selector) await page.locator(selector).hover();
	else if (action.type === 'click' && selector) await page.locator(selector).click();
	else if (action.type === 'scroll' && selector) await page.locator(selector).scrollIntoViewIfNeeded();
	else if (action.type === 'scroll')
		await page.evaluate((y: number) => window.scrollTo(0, y), (action.y as number) ?? 0);
	else if (action.type === 'wait') await page.waitForTimeout((action.ms as number) ?? 250);
}

async function transitionSeconds(page: Page, selector: string) {
	return page.locator(selector).evaluate((element) => {
		const style = getComputedStyle(element);
		const seconds = style.transitionDuration.split(',').map((value) => {
			const duration = value.trim();
			return duration.endsWith('ms') ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
		});
		return {
			maximum: Math.max(...seconds),
			timing: style.transitionTimingFunction,
		};
	});
}

for (const pagePlan of plan.pages) {
	for (const state of pagePlan.states ?? []) {
		if (state.name === 'initial') continue;
		test(`${pagePlan.id}: ${state.name}`, async ({ page }) => {
			await page.goto(pagePlan.implementationPath ?? pagePlan.path, { waitUntil: 'networkidle' });
			for (const action of state.actions ?? []) await runAction(page, action);
			if (state.expect?.implementationSelector) {
				await expect(page.locator(state.expect.implementationSelector)).toBeVisible();
			}
			for (const selector of state.expect?.motionSelectors ?? []) {
				const transition = await transitionSeconds(page, selector);
				expect(transition.maximum).toBeGreaterThan(0);
				expect(transition.timing).not.toBe('linear');
			}
			await expect(page.locator('main')).toBeVisible();
		});

		if ((state.expect?.motionSelectors ?? []).length > 0) {
			test(`${pagePlan.id}: ${state.name} respects reduced motion`, async ({ page }) => {
				await page.emulateMedia({ reducedMotion: 'reduce' });
				await page.goto(pagePlan.implementationPath ?? pagePlan.path, { waitUntil: 'networkidle' });
				for (const action of state.actions ?? []) await runAction(page, action);
				for (const selector of state.expect.motionSelectors) {
					const transition = await transitionSeconds(page, selector);
					expect(transition.maximum).toBeLessThanOrEqual(0.001);
				}
			});
		}
	}
}
