import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import matter from 'gray-matter';

const root = process.cwd();
const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
const onlySource = args.get('--source');
const onlySection = args.get('--section');
const overview = matter(fs.readFileSync(path.join(root, 'content', 'overview.md'), 'utf8')).data;
const reference = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'reference-manifest.json'), 'utf8'));
const plan = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'reference-plan.json'), 'utf8'));
const sourceUrls = new Map((overview.referencePages ?? []).map((page) => [page.id, page.url]));
const viewports = plan.viewports.filter((viewport) => ['desktop-1920', 'desktop-1440', 'tablet', 'mobile-390', 'mobile-360'].includes(viewport.name));

async function scrollSweep(page) {
	const dimensions = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, viewport: innerHeight }));
	for (let y = 0; y < dimensions.height; y += Math.max(300, Math.floor(dimensions.viewport * 0.72))) {
		await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
		await page.waitForTimeout(140);
	}
}

async function extract(locator) {
	return locator.evaluate((rootElement) => {
		const styleProperties = [
			'display', 'position', 'inset', 'z-index', 'overflow', 'overflow-x', 'overflow-y',
			'box-sizing', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
			'margin', 'padding', 'gap', 'grid-template-columns', 'grid-template-rows', 'grid-area',
			'align-items', 'align-content', 'justify-content', 'flex', 'flex-direction', 'flex-wrap',
			'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
			'text-align', 'text-transform', 'white-space', 'color', 'background', 'background-image',
			'border', 'border-radius', 'box-shadow', 'opacity', 'transform', 'transform-origin',
			'transition-property', 'transition-duration', 'transition-timing-function',
			'animation-name', 'animation-duration', 'animation-timing-function', 'clip-path', 'filter',
		];
		const elements = [rootElement, ...rootElement.querySelectorAll('*')];
		const indexes = new Map(elements.map((element, position) => [element, position]));
		const nodes = elements.slice(0, 1200).map((element, position) => {
			const style = getComputedStyle(element);
			const rect = element.getBoundingClientRect();
			const attributes = Object.fromEntries([...element.attributes]
				.filter((attribute) => ['id', 'class', 'role', 'aria-label', 'aria-expanded', 'href', 'src', 'srcset', 'poster', 'loading'].includes(attribute.name))
				.map((attribute) => [attribute.name, attribute.value]));
			return {
				index: position,
				parent: indexes.get(element.parentElement) ?? null,
				tag: element.tagName.toLowerCase(),
				attributes,
				directText: [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent?.trim()).filter(Boolean).join(' '),
				rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
				style: Object.fromEntries(styleProperties.map((property) => [property, style.getPropertyValue(property)])),
			};
		});
		const assets = elements.flatMap((element) => {
			const output = [];
			if (element instanceof HTMLImageElement) output.push({ type: 'image', url: element.currentSrc || element.src, srcset: element.srcset });
			if (element instanceof HTMLVideoElement) output.push({ type: 'video', url: element.currentSrc || element.src, poster: element.poster });
			if (element instanceof HTMLSourceElement && element.src) output.push({ type: 'source', url: element.src, media: element.media, mime: element.type });
			const background = getComputedStyle(element).backgroundImage;
			for (const match of background.matchAll(/url\(["']?([^"')]+)["']?\)/g)) output.push({ type: 'background', url: new URL(match[1], location.href).href });
			return output;
		}).filter((asset) => asset.url);
		const box = rootElement.getBoundingClientRect();
		return { nodes, assets, sectionRect: { x: box.x, y: box.y, width: box.width, height: box.height }, truncated: elements.length > 1200 };
	});
}

const browser = await chromium.launch();
let count = 0;
try {
	for (const pageEntry of reference.pages ?? []) {
		if (onlySource && pageEntry.sourceId !== onlySource) continue;
		const url = sourceUrls.get(pageEntry.sourceId);
		if (!url) throw new Error(`No approved reference URL for ${pageEntry.sourceId}.`);
		for (const section of pageEntry.sections ?? []) {
			if (onlySection && section.id !== onlySection) continue;
			const responsive = {};
			const domTopology = {};
			const computedStyles = {};
			const assets = [];
			let truncated = false;
			for (const viewport of viewports) {
				const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
				const page = await context.newPage();
				await page.goto(url, { waitUntil: 'domcontentloaded', timeout: plan.navigationTimeoutMs ?? 45_000 });
				if (reference.loading?.referenceHiddenSelector) await page.locator(reference.loading.referenceHiddenSelector).waitFor({ state: 'hidden', timeout: 20_000 });
				await scrollSweep(page);
				const locator = page.locator(section.referenceSelector).first();
				await locator.scrollIntoViewIfNeeded();
				await page.waitForTimeout(1000);
				const result = await extract(locator);
				responsive[viewport.name] = result.sectionRect;
				domTopology[viewport.name] = result.nodes.map(({ style, ...node }) => node);
				computedStyles[viewport.name] = result.nodes.map((node) => ({ index: node.index, style: node.style }));
				assets.push(...result.assets.map((asset) => ({ ...asset, viewport: viewport.name })));
				truncated ||= result.truncated;
				await context.close();
			}
			const spec = {
				sourceId: pageEntry.sourceId,
				sectionId: section.id,
				targetFile: section.targetFile ?? `src/components/clone/${pageEntry.sourceId}/${section.id}.astro`,
				interactionModel: section.interactionModel,
				domTopology,
				computedStyles,
				responsive,
				states: (plan.pages.find((page) => page.sourceId === pageEntry.sourceId)?.states ?? []).filter((state) => state.sectionId === section.id),
				assets: [...new Map(assets.map((asset) => [`${asset.type}:${asset.url}`, asset])).values()],
				unresolvedEvidence: [
					...(truncated ? ['DOM extraction exceeded 1200 nodes; narrow the selector or inspect omitted descendants.'] : []),
					...(section.interactionModel !== 'static' ? ['Record computed styles for every interactive state before builder dispatch.'] : []),
				],
			};
			const specPath = path.resolve(root, section.specPath);
			const allowed = path.resolve(root, 'artifacts', 'clone', 'forensics', 'specs');
			if (!specPath.startsWith(`${allowed}${path.sep}`)) throw new Error(`Unsafe specPath: ${section.specPath}`);
			fs.mkdirSync(path.dirname(specPath), { recursive: true });
			fs.writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
			count += 1;
		}
	}
} finally {
	await browser.close();
}
console.log(`Extracted ${count} section spec(s). Resolve every unresolvedEvidence item before locking forensics.`);
