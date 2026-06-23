import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const phase = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'phase-state.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'clone-assets.json'), 'utf8'));
const reference = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'reference-manifest.json'), 'utf8'));
const errors = [];

function walk(directory) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const absolute = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(absolute) : [absolute];
	});
}

const cloneActive = phase.clone?.inProgress || phase.clone?.totalIterations > 0 || phase.clone?.approved;
if (cloneActive) {
	if (manifest.status !== 'downloaded') errors.push('clone-assets status must be downloaded during the clone loop.');
	const requirements = (reference.mediaRequirements ?? []).filter((item) => item.required !== false);
	for (const requirement of requirements) {
		if (!(manifest.assets ?? []).some((asset) => asset.requirementId === requirement.id)) {
			errors.push(`Reference media was not downloaded for clone use: ${requirement.id}`);
		}
	}
	for (const [index, asset] of (manifest.assets ?? []).entries()) {
		const label = `assets[${index}]`;
		if (!asset.requirementId || !asset.sourceUrl || !asset.path || !asset.usedBy?.length) {
			errors.push(`${label} requires requirementId, sourceUrl, path, and usedBy.`);
			continue;
		}
		try { new URL(asset.sourceUrl); } catch { errors.push(`${label}.sourceUrl must be valid.`); }
		if (!asset.path.replaceAll('\\', '/').startsWith('clone-temp/')) {
			errors.push(`${label}.path must stay under public/clone-temp/.`);
			continue;
		}
		const file = path.join(root, 'public', asset.path);
		if (!fs.existsSync(file)) errors.push(`Downloaded clone asset is missing: ${asset.path}`);
		else if (asset.sha256) {
			const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
			if (actual !== asset.sha256) errors.push(`Clone asset checksum mismatch: ${asset.path}`);
		}
	}
	for (const file of [
		...walk(path.join(root, 'src', 'pages', '__clone')),
		...walk(path.join(root, 'src', 'components', 'clone')),
		...walk(path.join(root, 'src', 'styles', 'clone')),
	]) {
		if (!/\.(astro|html|css|ts|js)$/i.test(file)) continue;
		const source = fs.readFileSync(file, 'utf8');
		if (/(?:src|poster)\s*=\s*["']https?:|url\(\s*["']?https?:/i.test(source)) {
			errors.push(`Clone media must be downloaded, not hotlinked: ${path.relative(root, file)}`);
		}
	}
}

if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}
console.log('Temporary clone assets are valid.');
