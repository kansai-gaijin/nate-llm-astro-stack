import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mediaRoot = path.join(root, 'public', 'media');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'media', 'manifest.json'), 'utf8'));
const assets = manifest.assets ?? [];
const errors = [];

if (!Array.isArray(assets)) throw new Error('media/manifest.json must contain an assets array.');

function files(directory, base = directory) {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return files(entryPath, base);
		if (entry.name === '.gitkeep') return [];
		return [path.relative(base, entryPath).replaceAll('\\', '/')];
	});
}

const declaredPaths = new Set();
for (const [index, asset] of assets.entries()) {
	const label = `assets[${index}]`;
	if (!asset.path || !asset.type || !asset.origin) {
		errors.push(`${label} requires path, type, and origin.`);
		continue;
	}
	if (declaredPaths.has(asset.path)) errors.push(`Duplicate media path: ${asset.path}`);
	declaredPaths.add(asset.path);

	if (asset.origin === 'royalty-free') {
		for (const field of ['sourceUrl', 'licenseUrl', 'author', 'retrievedAt']) {
			if (!asset[field]) errors.push(`${label} requires ${field} for royalty-free media.`);
		}
	} else if (asset.origin === 'generated') {
		if (!asset.generator || !asset.prompt) {
			errors.push(`${label} requires generator and prompt for generated media.`);
		}
	} else if (asset.origin !== 'supplied') {
		errors.push(`${label}.origin must be generated, royalty-free, or supplied.`);
	}
}

for (const file of files(mediaRoot)) {
	if (!declaredPaths.has(file)) errors.push(`Unregistered public media file: ${file}`);
}

for (const declaredPath of declaredPaths) {
	if (!fs.existsSync(path.join(mediaRoot, declaredPath))) {
		errors.push(`Declared media file is missing: ${declaredPath}`);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}

console.log(`Media provenance is valid for ${assets.length} asset(s).`);
