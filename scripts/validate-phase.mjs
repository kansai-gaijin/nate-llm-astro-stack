import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'phase-state.json'), 'utf8'));
const overview = matter(fs.readFileSync(path.join(root, 'content', 'overview.md'), 'utf8')).data;
const protectedBaselinePath = path.join(root, 'workflow', 'clone-protected-baseline.json');
const approvedClonePath = path.join(root, 'workflow', 'approved-clone-baseline.json');
const errors = [];

function walk(directory, include = () => true) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) return walk(absolute, include);
		return include(absolute) ? [absolute] : [];
	});
}

function snapshot(files) {
	return Object.fromEntries(files.sort().map((file) => [
		path.relative(root, file).replaceAll('\\', '/'),
		crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
	]));
}

function protectedFiles() {
	return [
		...walk(path.join(root, 'content')),
		...walk(path.join(root, 'public', 'media')),
		...walk(path.join(root, 'src', 'config')),
		...walk(path.join(root, 'src', 'lib', 'content')),
		...walk(path.join(root, 'src', 'pages'), (file) => !file.replaceAll('\\', '/').includes('/pages/__clone/')),
		...walk(path.join(root, 'src', 'components'), (file) => !file.replaceAll('\\', '/').includes('/components/clone/')),
	];
}

function cloneFiles() {
	return [
		...walk(path.join(root, 'src', 'pages', '__clone')),
		...walk(path.join(root, 'src', 'components', 'clone')),
		...walk(path.join(root, 'src', 'styles', 'clone')),
		...walk(path.join(root, 'src', 'scripts', 'clone')),
		...walk(path.join(root, 'public', 'clone-temp')),
	];
}

function compareSnapshot(file, actual, label) {
	if (!fs.existsSync(file)) {
		errors.push(`Missing ${label} baseline. Start the phase through scripts/phase-state.mjs.`);
		return;
	}
	const expected = JSON.parse(fs.readFileSync(file, 'utf8'));
	if (JSON.stringify(expected) !== JSON.stringify(actual)) errors.push(`${label} files changed outside the allowed phase boundary.`);
}

const cloneActive = state.clone?.inProgress || state.clone?.totalIterations > 0 || state.clone?.approved;
if (cloneActive) {
	compareSnapshot(protectedBaselinePath, snapshot(protectedFiles()), 'clone-protected');
	const cloneSources = cloneFiles().filter((file) => /\.(astro|ts|js|css|json|md)$/i.test(file));
	if (cloneSources.length === 0) errors.push('Clone phase has no files under the dedicated clone directories.');
	const prohibited = [overview.siteName, 'src/lib/content', 'content/pages', 'content/wireframes'].filter(Boolean);
	for (const file of cloneSources) {
		const source = fs.readFileSync(file, 'utf8');
		for (const value of prohibited) {
			if (source.includes(value)) errors.push(`Clone file uses prohibited supplied-content input (${value}): ${path.relative(root, file)}`);
		}
	}
}

if (state.adaptation?.inProgress || (state.adaptation?.totalIterations > 0 && !state.adaptation?.approved)) {
	if (!state.clone?.approved || !state.adaptation?.unlocked) errors.push('Adaptation ran without explicit clone approval.');
	compareSnapshot(approvedClonePath, snapshot(cloneFiles()), 'approved-clone');
}

if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}

console.log('Clone/adaptation phase boundaries are valid.');
