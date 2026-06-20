import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'microcms', 'manifest.json'), 'utf8'));
const errors = [];

function validateFixture(endpoint, filePath) {
	const schemaPath = path.join(root, 'microcms', 'schemas', endpoint.schema);
	if (!fs.existsSync(schemaPath)) {
		errors.push(`Missing schema for ${endpoint.endpoint}: microcms/schemas/${endpoint.schema}`);
		return;
	}
	const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
	const parsed = matter(fs.readFileSync(filePath, 'utf8'));
	const values = { ...parsed.data, body: parsed.content.trim() };
	for (const field of schema.apiFields ?? []) {
		const value = values[field.fieldId];
		if (field.required && (value === undefined || value === null || value === '')) {
			errors.push(`${path.relative(root, filePath)} is missing required field '${field.fieldId}'.`);
		}
		if (field.kind === 'media' && value && typeof value === 'string' && !value.startsWith('/media/')) {
			errors.push(`${path.relative(root, filePath)} media field '${field.fieldId}' must use /media/.`);
		}
	}
}

for (const endpoint of manifest.endpoints ?? []) {
	const directory = path.join(root, 'content', 'dynamic', endpoint.endpoint);
	if (!fs.existsSync(directory)) {
		errors.push(`Missing Markdown fallback directory: content/dynamic/${endpoint.endpoint}`);
		continue;
	}

	if (endpoint.type === 'object') {
		const objectPath = path.join(directory, 'index.md');
		if (!fs.existsSync(objectPath)) errors.push(`Missing object fallback: content/dynamic/${endpoint.endpoint}/index.md`);
		else validateFixture(endpoint, objectPath);
		continue;
	}

	const files = fs.readdirSync(directory).filter((file) => /\.mdx?$/.test(file) && file !== 'index.md');
	const requiredCount = Number(endpoint.fixtureCount ?? 20);
	if (files.length < requiredCount) {
		errors.push(`${endpoint.endpoint} requires ${requiredCount} fixtures, found ${files.length}.`);
	}
	const ids = new Set();
	for (const file of files) {
		const filePath = path.join(directory, file);
		const parsed = matter(fs.readFileSync(filePath, 'utf8'));
		const id = String(parsed.data.id ?? path.basename(file, path.extname(file)));
		if (ids.has(id)) errors.push(`Duplicate ${endpoint.endpoint} fixture id: ${id}`);
		ids.add(id);
		validateFixture(endpoint, filePath);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}

console.log(`Dynamic Markdown fallback is valid for ${(manifest.endpoints ?? []).length} endpoint(s).`);
