import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const overviewPath = path.join(root, 'content', 'overview.md');
const errors = [];
const warnings = [];

if (!fs.existsSync(overviewPath)) {
	errors.push('Missing content/overview.md.');
} else {
	const overview = matter(fs.readFileSync(overviewPath, 'utf8'));
	const { referenceUrl, pages, microcms } = overview.data;

	try {
		const parsedUrl = new URL(referenceUrl);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			errors.push('referenceUrl must use http or https.');
		}
		if (parsedUrl.hostname === 'example.com') {
			warnings.push('referenceUrl still points to example.com.');
		}
	} catch {
		errors.push('content/overview.md must define a valid referenceUrl in frontmatter.');
	}

	if (!Array.isArray(pages) || pages.length === 0) {
		errors.push('content/overview.md must define at least one page.');
	} else {
		const routes = new Set();
		for (const [index, page] of pages.entries()) {
			const label = `pages[${index}]`;
			if (!page || typeof page !== 'object') {
				errors.push(`${label} must be an object.`);
				continue;
			}
			if (typeof page.path !== 'string' || !page.path.startsWith('/')) {
				errors.push(`${label}.path must start with '/'.`);
			} else if (routes.has(page.path)) {
				errors.push(`Duplicate route: ${page.path}`);
			} else {
				routes.add(page.path);
			}

			if (typeof page.file !== 'string' || page.file.trim() === '') {
				errors.push(`${label}.file is required.`);
				continue;
			}

			const pagesRoot = path.resolve(root, 'content', 'pages');
			const pagePath = path.resolve(pagesRoot, page.file);
			if (!pagePath.startsWith(`${pagesRoot}${path.sep}`)) {
				errors.push(`${label}.file must stay within content/pages/.`);
			} else if (!fs.existsSync(pagePath)) {
				errors.push(`Missing page content file: content/pages/${page.file}`);
			} else if (!matter(fs.readFileSync(pagePath, 'utf8')).content.trim()) {
				errors.push(`Page content is empty: content/pages/${page.file}`);
			}
		}

		if (!routes.has('/')) errors.push("The sitemap must include the top page route '/'.");
	}

	if (microcms?.required && !Array.isArray(microcms.endpoints)) {
		errors.push('microcms.endpoints must be an array when microCMS is required.');
	}
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length > 0) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}

console.log('Content contract is valid.');
