import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ContentEntry, ContentListResult, ContentQueries } from './types';

const dynamicRoot = path.resolve('content', 'dynamic');

function collectionDirectory(endpoint: string): string {
	if (!/^[a-z0-9][a-z0-9-_]*$/i.test(endpoint)) {
		throw new Error(`Invalid content endpoint: ${endpoint}`);
	}
	return path.join(dynamicRoot, endpoint);
}

function readEntry<T extends ContentEntry>(filePath: string): T {
	const parsed = matter(fs.readFileSync(filePath, 'utf8'));
	const filename = path.basename(filePath, path.extname(filePath));
	return {
		...parsed.data,
		id: String(parsed.data.id ?? filename),
		body: parsed.content.trim(),
	} as unknown as T;
}

function orderEntries<T extends ContentEntry>(entries: T[], orders?: string): T[] {
	if (!orders) return entries;
	const fields = orders.split(',').map((value) => value.trim()).filter(Boolean);
	return [...entries].sort((left, right) => {
		for (const field of fields) {
			const descending = field.startsWith('-');
			const key = descending ? field.slice(1) : field;
			const comparison = String(left[key] ?? '').localeCompare(String(right[key] ?? ''));
			if (comparison !== 0) return descending ? -comparison : comparison;
		}
		return 0;
	});
}

export async function getMarkdownList<T extends ContentEntry>(
	endpoint: string,
	queries: ContentQueries = {},
): Promise<ContentListResult<T>> {
	const directory = collectionDirectory(endpoint);
	if (!fs.existsSync(directory)) {
		throw new Error(`Markdown fallback directory is missing: content/dynamic/${endpoint}`);
	}

	const entries = fs
		.readdirSync(directory, { withFileTypes: true })
		.filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name) && entry.name !== 'index.md')
		.map((entry) => readEntry<T>(path.join(directory, entry.name)));
	const ordered = orderEntries(entries, queries.orders);
	const offset = Math.max(0, Number(queries.offset ?? 0));
	const limit = Math.max(0, Number(queries.limit ?? ordered.length));

	return {
		contents: ordered.slice(offset, offset + limit),
		totalCount: ordered.length,
		offset,
		limit,
	};
}

export async function getMarkdownObject<T extends ContentEntry>(endpoint: string): Promise<T> {
	const filePath = path.join(collectionDirectory(endpoint), 'index.md');
	if (!fs.existsSync(filePath)) {
		throw new Error(`Markdown fallback object is missing: content/dynamic/${endpoint}/index.md`);
	}
	return readEntry<T>(filePath);
}
