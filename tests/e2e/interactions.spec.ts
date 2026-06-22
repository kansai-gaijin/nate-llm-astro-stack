import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const plan = JSON.parse(fs.readFileSync(path.resolve('workflow', 'reference-plan.json'), 'utf8'));
const motionManifest = JSON.parse(fs.readFileSync(path.resolve('workflow', 'motion-manifest.json'), 'utf8'));
const motions = new Map((motionManifest.interactions ?? []).map((interaction: Record<string, unknown>) => [interaction.id, interaction]));

async function runAction(page: Page, action: Record<string, unknown>) {
	const selector = (action.implementationSelector ?? action.selector) as string | undefined;
	if (action.type === 'hover' && selector) await page.locator(selector).hover();
	else if (action.type === 'click' && selector) await page.locator(selector).click();
	else if (action.type === 'focus' && selector) await page.locator(selector).focus();
	else if (action.type === 'press' && selector) await page.locator(selector).press(action.key as string);
	else if (action.type === 'scroll' && selector) await page.locator(selector).scrollIntoViewIfNeeded();
	else if (action.type === 'scroll') await page.evaluate((y: number) => window.scrollTo(0, y), (action.y as number) ?? 0);
	else if (action.type === 'wait') await page.waitForTimeout((action.ms as number) ?? 250);
	else if (action.type === 'seekAnimations' && selector) {
		await page.locator(selector).evaluateAll((elements, currentTime) => {
			for (const element of elements) {
				for (const animation of element.getAnimations({ subtree: true })) {
					animation.pause();
					animation.currentTime = currentTime;
				}
			}
		}, (action.ms as number) ?? 0);
	}
}

function milliseconds(value: string) {
	return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
}

async function observedTiming(page: Page, selector: string) {
	return page.locator(selector).evaluate((element) => {
		const style = getComputedStyle(element);
		const transitions = style.transitionDuration.split(',').map((duration) => ({
			duration: duration.trim(),
			easing: style.transitionTimingFunction,
		}));
		const animations = element.getAnimations({ subtree: true }).map((animation) => {
			const timing = animation.effect?.getTiming();
			return {
				duration: typeof timing?.duration === 'number' ? `${timing.duration}ms` : '0ms',
				easing: timing?.easing ?? 'linear',
			};
		});
		return [...transitions, ...animations];
	});
}

async function assertComputedStyles(page: Page, checks: Array<Record<string, unknown>> = []) {
	for (const check of checks) {
		const actual = await page.locator(check.implementationSelector as string).evaluate(
			(element, property) => getComputedStyle(element).getPropertyValue(property).trim(),
			check.property as string,
		);
		if (typeof check.expectedNumber === 'number') {
			expect(Number.parseFloat(actual)).toBeCloseTo(check.expectedNumber, (check.precision as number | undefined) ?? 1);
		} else {
			expect(actual).toBe(check.expected);
		}
	}
}

for (const pagePlan of plan.pages) {
	for (const state of pagePlan.states ?? []) {
		if (state.kind === 'template') continue;
		test(`${pagePlan.id}: ${state.name}`, async ({ page }) => {
			await page.goto(pagePlan.implementationPath ?? pagePlan.path, { waitUntil: 'networkidle' });
			for (const action of state.actions ?? []) await runAction(page, action);
			if (state.expect?.implementationSelector) {
				await expect(page.locator(state.expect.implementationSelector)).toBeVisible();
			}
			await assertComputedStyles(page, state.expect?.computedStyles);

			if (state.motionId) {
				const motion = motions.get(state.motionId) as Record<string, unknown> | undefined;
				expect(motion, `Missing motion contract: ${state.motionId}`).toBeTruthy();
				if (['css-transition', 'web-animations'].includes(motion?.driver as string)) {
					const timing = await observedTiming(page, motion?.implementationSelector as string);
					const observed = timing.map((item) => ({ ...item, milliseconds: milliseconds(item.duration) }))
						.find((item) => item.milliseconds > 0);
					expect(observed, `No browser-observable timing for ${state.motionId}`).toBeTruthy();
					const expectedMs = motion?.durationMs as number;
					const tolerance = Math.max(50, expectedMs * 0.1);
					expect(Math.abs((observed?.milliseconds ?? 0) - expectedMs)).toBeLessThanOrEqual(tolerance);
					const acceptedEasings = [motion?.easing, ...((motion?.easingAliases as string[] | undefined) ?? [])];
					expect(acceptedEasings).toContain(observed?.easing);
				}
			}
			await expect(page.locator('main')).toBeVisible();
		});

		if (state.motionId && state.sampleMs === 0) {
			test(`${pagePlan.id}: ${state.motionId} respects reduced motion`, async ({ page }) => {
				await page.emulateMedia({ reducedMotion: 'reduce' });
				await page.goto(pagePlan.implementationPath ?? pagePlan.path, { waitUntil: 'networkidle' });
				for (const action of state.actions ?? []) await runAction(page, action);
				const motion = motions.get(state.motionId) as Record<string, unknown>;
				if (['css-transition', 'web-animations'].includes(motion.driver as string)) {
					const timing = await observedTiming(page, motion.implementationSelector as string);
					const maximum = Math.max(0, ...timing.map((item) => milliseconds(item.duration)));
					expect(maximum).toBeLessThanOrEqual(1);
				} else {
					await assertComputedStyles(page, state.expect?.reducedMotionStyles);
				}
			});
		}
	}
}
