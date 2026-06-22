import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mediaRoot = path.join(root, 'public', 'media');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'media', 'manifest.json'), 'utf8'));
const referenceManifest = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'reference-manifest.json'), 'utf8'));
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

	if (referenceManifest.status === 'locked') {
		if (!['reference-replacement', 'content', 'dynamic-fixture'].includes(asset.purpose)) {
			errors.push(`${label} requires purpose: reference-replacement, content, or dynamic-fixture.`);
		}
		if (asset.purpose === 'reference-replacement' && !asset.requirementId) {
			errors.push(`${label} requires requirementId for a reference replacement.`);
		}
		if (!Array.isArray(asset.usedBy) || asset.usedBy.length === 0) {
			errors.push(`${label} requires a non-empty usedBy list when reference evidence is locked.`);
		}
		for (const usedBy of asset.usedBy ?? []) {
			const sourcePath = path.join(root, usedBy);
			if (!fs.existsSync(sourcePath)) {
				errors.push(`${label}.usedBy file does not exist: ${usedBy}`);
				continue;
			}
			const source = fs.readFileSync(sourcePath, 'utf8').replaceAll('\\', '/');
			if (!source.includes(asset.path) && !source.includes(`/media/${asset.path}`)) {
				errors.push(`${label} is not referenced by its usedBy file: ${usedBy}`);
			}
		}
	}
}

if (referenceManifest.status === 'locked') {
	const requirements = referenceManifest.mediaRequirements ?? [];
	if (referenceManifest.mediaDecision?.requiresVisualMedia === true && requirements.length === 0) {
		errors.push('Reference requires visual media but mediaRequirements is empty.');
	}
	for (const requirement of requirements.filter((item) => item.required !== false)) {
		if (!requirement.id || !requirement.type || !requirement.route || !requirement.referenceAspectRatio) {
			errors.push('Every required media requirement needs id, type, route, and referenceAspectRatio.');
			continue;
		}
		if (!['royalty-free', 'generated', 'supplied'].includes(requirement.replacementStrategy)) {
			errors.push(`Media requirement ${requirement.id} needs an approved replacementStrategy.`);
		}
		const replacement = assets.find((asset) =>
			asset.purpose === 'reference-replacement' && asset.requirementId === requirement.id,
		);
		if (!replacement) {
			errors.push(`Required reference media has no integrated replacement: ${requirement.id}`);
			continue;
		}
		if (requirement.type === 'video' && replacement.type !== 'video') {
			errors.push(`Video requirement ${requirement.id} must use video unless a static fallback was user-approved.`);
		}
		if (requirement.type === 'video' && replacement.origin === 'generated') {
			errors.push(`Video requirement ${requirement.id} must be royalty-free or supplied.`);
		}
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
