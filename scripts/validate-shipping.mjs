import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const phase = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'phase-state.json'), 'utf8'));
const contentMap = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'content-map.json'), 'utf8'));
const design = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'design-adaptation.json'), 'utf8'));
const cloneAssets = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'clone-assets.json'), 'utf8'));
const referenceCopy = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'reference-copy.json'), 'utf8'));

function walk(directory) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const absolute = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(absolute) : [absolute];
	});
}
for (const relative of ['src/pages/__clone', 'public/clone-temp']) {
	const absolute = path.join(root, relative);
	if (fs.existsSync(absolute) && fs.readdirSync(absolute).length > 0) {
		errors.push(`Temporary clone material must be removed before shipping: ${relative}`);
	}
}
if (phase.adaptation?.approved) {
	if (contentMap.status !== 'mapped') errors.push('Approved content must have a complete content map before shipping.');
	if (design.status !== 'approved' || design.referenceMaterialRemoved !== true) {
		errors.push('design-adaptation must be approved and confirm reference material removal before shipping.');
	}
}

const shippingSources = walk(path.join(root, 'src')).filter((file) =>
	/\.(astro|html|css|ts|js|json|md)$/i.test(file) && !file.replaceAll('\\', '/').includes('/pages/__clone/'),
);
const prohibitedUrls = (cloneAssets.assets ?? []).flatMap((asset) => [asset.sourceUrl, asset.resolvedSourceUrl]).filter(Boolean);
const prohibitedCopy = (referenceCopy.entries ?? []).map((entry) => entry.text.trim()).filter((text) => text.length >= 20);
for (const file of shippingSources) {
	const source = fs.readFileSync(file, 'utf8');
	if (source.includes('clone-temp/') || source.includes('/__clone/')) errors.push(`Final source imports temporary clone material: ${path.relative(root, file)}`);
	for (const url of prohibitedUrls) if (source.includes(url)) errors.push(`Final source retains a reference asset URL: ${path.relative(root, file)}`);
	for (const text of prohibitedCopy) if (source.includes(text)) errors.push(`Final source retains substantial reference copy: ${path.relative(root, file)}`);
}
if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}
console.log('Shipping source contains no temporary routes, reference assets, or substantial reference copy.');
