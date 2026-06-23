import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const captureExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.webm', '.mp4', '.mov', '.zip']);
const captureDirectories = new Set(['screenshots', 'captures', 'problems']);
const errors = [];

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
	if (entry.isFile() && captureExtensions.has(path.extname(entry.name).toLowerCase())) {
		errors.push(`Root capture file is not allowed: ${entry.name}`);
	}
	if (entry.isDirectory() && captureDirectories.has(entry.name.toLowerCase())) {
		errors.push(`Root capture directory is not allowed: ${entry.name}/`);
	}
}

if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	console.error('Store screenshots, videos, traces, and visual notes under ignored artifacts/ subfolders.');
	process.exit(1);
}

console.log('Capture artifacts are confined to ignored artifact directories.');
