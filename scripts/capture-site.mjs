import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import matter from 'gray-matter';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
	args.set(process.argv[index], process.argv[index + 1]);
}

const target = args.get('--target');
if (!['reference', 'implementation'].includes(target)) {
	throw new Error('Use --target reference or --target implementation.');
}

const root = process.cwd();
const planPath = path.resolve(args.get('--plan') ?? 'workflow/reference-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const overview = matter(fs.readFileSync(path.join(root, 'content', 'overview.md'), 'utf8')).data;
const implementationBaseUrl = args.get('--base-url') ?? process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:4321';
const outputRoot = path.resolve(args.get('--output') ?? path.join('artifacts', target));

async function isReachable(url) {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(1_500) });
		return response.ok;
	} catch {
		return false;
	}
}

async function requireImplementationServer() {
	if (target !== 'implementation' || (await isReachable(implementationBaseUrl))) return;
	throw new Error(`No orchestrator-managed server at ${implementationBaseUrl}. Run npm run loop:serve:start once for the batch.`);
}

function pageUrl(pagePlan) {
	if (target === 'reference') {
		return pagePlan.referenceUrl ?? new URL(pagePlan.path, overview.referenceUrl).toString();
	}
	return new URL(pagePlan.implementationPath ?? pagePlan.path, implementationBaseUrl).toString();
}

function selectorFor(action) {
	return action[`${target}Selector`] ?? action.selector;
}

async function runAction(page, action) {
	const selector = selectorFor(action);
	switch (action.type) {
		case 'click':
			await page.locator(selector).click();
			break;
		case 'hover':
			await page.locator(selector).hover();
			break;
		case 'focus':
			await page.locator(selector).focus();
			break;
		case 'press':
			await page.locator(selector).press(action.key);
			break;
		case 'scroll':
			if (selector) await page.locator(selector).scrollIntoViewIfNeeded();
			else await page.evaluate((y) => window.scrollTo(0, y), action.y ?? 0);
			break;
		case 'wait':
			await page.waitForTimeout(action.ms ?? 250);
			break;
		case 'seekAnimations':
			await page.locator(selector).evaluateAll((elements, currentTime) => {
				for (const element of elements) {
					for (const animation of element.getAnimations({ subtree: true })) {
						animation.pause();
						animation.currentTime = currentTime;
					}
				}
			}, action.ms ?? 0);
			break;
		default:
			throw new Error(`Unsupported capture action: ${action.type}`);
	}
}

async function waitForReadiness(page, state) {
	const readiness = state.readiness;
	if (!readiness) return;
	const selector = readiness[`${target}Selector`] ?? readiness.selector;
	if (selector) {
		await page.locator(selector).waitFor({
			state: readiness.state ?? 'visible',
			timeout: readiness.timeoutMs ?? 15_000,
		});
	}
	if (readiness.media === true) {
		await page.waitForFunction(() => {
			const imagesReady = [...document.images].every((image) => image.complete);
			const videosReady = [...document.querySelectorAll('video')].every((video) =>
				video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || Boolean(video.poster),
			);
			return imagesReady && videosReady;
		}, undefined, { timeout: readiness.timeoutMs ?? 15_000 });
	}
}

async function measurementsFor(page, state) {
	const measurements = {};
	for (const measurement of state.measurements ?? []) {
		const selector = measurement[`${target}Selector`] ?? measurement.selector;
		measurements[measurement.id] = await page.locator(selector).evaluate((element) => {
			const box = element.getBoundingClientRect();
			const style = getComputedStyle(element);
			return {
				x: box.x,
				y: box.y,
				width: box.width,
				height: box.height,
				display: style.display,
				position: style.position,
				opacity: style.opacity,
				transform: style.transform,
				borderRadius: style.borderRadius,
				fontFamily: style.fontFamily,
				fontSize: style.fontSize,
				lineHeight: style.lineHeight,
			};
		});
	}
	return measurements;
}

fs.mkdirSync(outputRoot, { recursive: true });
await requireImplementationServer();
const browser = await chromium.launch();
const metadata = [];

try {
	for (const viewport of plan.viewports) {
		const context = await browser.newContext({
			viewport: { width: viewport.width, height: viewport.height },
			colorScheme: plan.colorScheme ?? 'light',
			reducedMotion: 'no-preference',
		});
		const page = await context.newPage();

		for (const pagePlan of plan.pages) {
			for (const state of pagePlan.states ?? [{ name: 'initial', actions: [] }]) {
				if (state.viewports?.length && !state.viewports.includes(viewport.name)) continue;
				if ((target === 'reference' && state.implementationOnly) || (target === 'implementation' && state.referenceOnly)) {
					continue;
				}
				await page.goto(pageUrl(pagePlan), {
					waitUntil: state.waitUntil ?? 'networkidle',
					timeout: plan.navigationTimeoutMs ?? 45_000,
				});
				await waitForReadiness(page, state);
				for (const action of state.actions ?? []) await runAction(page, action);
				if (state.delayMs) await page.waitForTimeout(state.delayMs);

				const pageDirectory = path.join(outputRoot, viewport.name, pagePlan.id);
				fs.mkdirSync(pageDirectory, { recursive: true });
				const screenshotPath = path.join(pageDirectory, `${state.name}.png`);
				if (!state.skipFontWait) await page.evaluate(() => document.fonts.ready);
				await page.screenshot({
					path: screenshotPath,
					fullPage: Boolean(state.fullPage),
					animations: state.animations ?? 'allow',
					caret: 'hide',
				});

				const pageMetadata = await page.evaluate(() => ({
					title: document.title,
					documentHeight: document.documentElement.scrollHeight,
					fonts: [...new Set([...document.querySelectorAll('*')].map((element) => getComputedStyle(element).fontFamily))].slice(0, 30),
					headings: [...document.querySelectorAll('h1,h2,h3')].map((element) => element.textContent?.trim()).filter(Boolean),
				}));
				metadata.push({
					viewport: viewport.name,
					page: pagePlan.id,
					state: state.name,
					kind: state.kind,
					url: page.url(),
					measurements: await measurementsFor(page, state),
					...pageMetadata,
				});
			}
		}

		await context.close();
	}
} finally {
	await browser.close();
}

fs.writeFileSync(path.join(outputRoot, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Captured ${metadata.length} state(s) in ${path.relative(root, outputRoot)}.`);
