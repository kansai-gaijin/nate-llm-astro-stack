import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
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
let previewProcess;

async function isReachable(url) {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(1_500) });
		return response.ok;
	} catch {
		return false;
	}
}

async function ensureImplementationServer() {
	if (target !== 'implementation' || (await isReachable(implementationBaseUrl))) return;

	const astroCli = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
	const result = spawnSync(process.execPath, [astroCli, 'build'], { cwd: root, stdio: 'inherit' });
	if (result.status !== 0) throw new Error('Astro build failed before capture.');

	previewProcess = spawn(process.execPath, [astroCli, 'preview', '--host', '127.0.0.1'], {
		cwd: root,
		stdio: 'ignore',
	});

	for (let attempt = 0; attempt < 40; attempt += 1) {
		if (await isReachable(implementationBaseUrl)) return;
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Could not start the Astro preview server at ${implementationBaseUrl}.`);
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
		case 'scroll':
			if (selector) await page.locator(selector).scrollIntoViewIfNeeded();
			else await page.evaluate((y) => window.scrollTo(0, y), action.y ?? 0);
			break;
		case 'wait':
			await page.waitForTimeout(action.ms ?? 250);
			break;
		default:
			throw new Error(`Unsupported capture action: ${action.type}`);
	}
}

fs.mkdirSync(outputRoot, { recursive: true });
await ensureImplementationServer();
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
				if ((target === 'reference' && state.implementationOnly) || (target === 'implementation' && state.referenceOnly)) {
					continue;
				}
				await page.goto(pageUrl(pagePlan), {
					waitUntil: state.waitUntil ?? 'networkidle',
					timeout: plan.navigationTimeoutMs ?? 45_000,
				});
				for (const action of state.actions ?? []) await runAction(page, action);
				if (state.delayMs) await page.waitForTimeout(state.delayMs);

				const pageDirectory = path.join(outputRoot, viewport.name, pagePlan.id);
				fs.mkdirSync(pageDirectory, { recursive: true });
				const screenshotPath = path.join(pageDirectory, `${state.name}.png`);
				if (!state.skipFontWait) await page.evaluate(() => document.fonts.ready);
				await page.screenshot({
					path: screenshotPath,
					fullPage: Boolean(state.fullPage),
					animations: state.animations ?? 'disabled',
					caret: 'hide',
				});

				const pageMetadata = await page.evaluate(() => ({
					title: document.title,
					documentHeight: document.documentElement.scrollHeight,
					fonts: [...new Set([...document.querySelectorAll('*')].map((element) => getComputedStyle(element).fontFamily))].slice(0, 30),
					headings: [...document.querySelectorAll('h1,h2,h3')].map((element) => element.textContent?.trim()).filter(Boolean),
				}));
				metadata.push({ viewport: viewport.name, page: pagePlan.id, state: state.name, url: page.url(), ...pageMetadata });
			}
		}

		await context.close();
	}
} finally {
	await browser.close();
	previewProcess?.kill();
}

fs.writeFileSync(path.join(outputRoot, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Captured ${metadata.length} state(s) in ${path.relative(root, outputRoot)}.`);
