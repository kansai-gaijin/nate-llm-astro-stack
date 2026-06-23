import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const referencePath = path.join(root, 'workflow', 'reference-manifest.json');
const cloneAssetsPath = path.join(root, 'workflow', 'clone-assets.json');
const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));

if (reference.status !== 'locked') {
	throw new Error('Lock reference forensics before downloading clone assets.');
}

const required = (reference.mediaRequirements ?? []).filter((item) => item.required !== false);
const extensionByType = new Map([
	['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/avif', '.avif'],
	['image/gif', '.gif'], ['image/svg+xml', '.svg'], ['video/mp4', '.mp4'], ['video/webm', '.webm'],
]);

function safeSegment(value) {
	return String(value).replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'asset';
}

function requestedPath(requirement, contentType) {
	if (requirement.localPath) {
		const normalized = requirement.localPath.replaceAll('\\', '/');
		if (!normalized.startsWith('clone-temp/') || normalized.includes('..')) {
			throw new Error(`${requirement.id}.localPath must stay under clone-temp/.`);
		}
		return normalized;
	}
	const source = new URL(requirement.sourceUrl);
	const sourceExtension = path.extname(source.pathname).toLowerCase();
	const extension = sourceExtension && sourceExtension.length <= 8
		? sourceExtension
		: extensionByType.get(contentType.split(';')[0].trim()) ?? '.bin';
	return `clone-temp/${safeSegment(requirement.sourceId ?? 'shared')}/${safeSegment(requirement.id)}${extension}`;
}

async function download(requirement) {
	if (!requirement.id || !requirement.sourceUrl || !requirement.usedBy?.length) {
		throw new Error(`Media requirement requires id, sourceUrl, and usedBy: ${requirement.id ?? '<unnamed>'}`);
	}
	const response = await fetch(requirement.sourceUrl, {
		redirect: 'follow',
		headers: { 'user-agent': 'Astro-Reference-Clone/1.0' },
	});
	if (!response.ok) throw new Error(`Download failed (${response.status}) for ${requirement.sourceUrl}`);
	const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
	const bytes = Buffer.from(await response.arrayBuffer());
	if (bytes.length === 0) throw new Error(`Downloaded empty asset: ${requirement.sourceUrl}`);
	const publicPath = requestedPath(requirement, contentType);
	const absolute = path.join(root, 'public', ...publicPath.split('/'));
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	fs.writeFileSync(absolute, bytes);
	return {
		requirementId: requirement.id,
		sourceUrl: requirement.sourceUrl,
		resolvedSourceUrl: response.url,
		path: publicPath,
		contentType,
		bytes: bytes.length,
		sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
		usedBy: requirement.usedBy,
	};
}

const assets = [];
for (const requirement of required) assets.push(await download(requirement));
fs.writeFileSync(cloneAssetsPath, `${JSON.stringify({ status: 'downloaded', downloadedAt: new Date().toISOString(), assets }, null, 2)}\n`);
console.log(`Downloaded ${assets.length} reference asset(s) into public/clone-temp/.`);
