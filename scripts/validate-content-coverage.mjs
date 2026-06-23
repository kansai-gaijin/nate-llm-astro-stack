import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const overview = matter(fs.readFileSync(path.join(root, 'content', 'overview.md'), 'utf8')).data;
const phase = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'phase-state.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'content-map.json'), 'utf8'));
const errors = [];

function cleanInline(value) {
	return value
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[*_~`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function blocks(markdown) {
	const output = [];
	let paragraph = [];
	let fenced = false;
	const flush = () => {
		const value = cleanInline(paragraph.join(' '));
		if (value) output.push(value);
		paragraph = [];
	};
	for (const raw of markdown.split(/\r?\n/)) {
		const line = raw.trim();
		if (/^```/.test(line)) { flush(); fenced = !fenced; continue; }
		if (fenced) continue;
		if (!line) { flush(); continue; }
		const structural = line.match(/^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s*)(.*)$/);
		if (structural) { flush(); const value = cleanInline(structural[1]); if (value) output.push(value); }
		else paragraph.push(line);
	}
	flush();
	return output;
}

function id(file, route, text) {
	return crypto.createHash('sha256').update(`${file}\0${route}\0${text}`).digest('hex').slice(0, 16);
}

const expected = [];
for (const page of overview.pages ?? []) {
	const sourceFile = `content/pages/${page.file}`;
	const parsed = matter(fs.readFileSync(path.join(root, sourceFile), 'utf8'));
	for (const text of blocks(parsed.content)) expected.push({ id: id(sourceFile, page.path, text), sourceFile, route: page.path, text });
}

const adaptationActive = phase.adaptation?.inProgress || phase.adaptation?.totalIterations > 0 || phase.adaptation?.approved;
if (adaptationActive && map.status !== 'mapped') errors.push('content-map status must be mapped during adaptation.');
if (map.status === 'mapped') {
	const entries = new Map();
	for (const entry of map.entries ?? []) {
		if (!entry.id || !entry.sourceFile || !entry.route || !entry.text || !entry.selector) {
			errors.push('Every content-map entry requires id, sourceFile, route, text, and selector.');
			continue;
		}
		if (entries.has(entry.id)) errors.push(`Duplicate content-map id: ${entry.id}`);
		entries.set(entry.id, entry);
	}
	for (const block of expected) {
		const entry = entries.get(block.id);
		if (!entry) errors.push(`Approved content block is not mapped: ${block.sourceFile} :: ${block.text.slice(0, 80)}`);
		else if (entry.text !== block.text || entry.route !== block.route || entry.sourceFile !== block.sourceFile) {
			errors.push(`Content-map entry was altered instead of copied exactly: ${block.id}`);
		}
	}
	const expectedIds = new Set(expected.map((block) => block.id));
	for (const entry of map.entries ?? []) if (entry.id && !expectedIds.has(entry.id)) errors.push(`Content-map includes non-approved text: ${entry.id}`);
}

if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}
console.log(`Approved content coverage is valid for ${expected.length} block(s).`);
