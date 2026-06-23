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
	const { referenceUrl, referencePages, pages, microcms } = overview.data;

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

	if (!Array.isArray(referencePages) || referencePages.length === 0) {
		errors.push('content/overview.md must define referencePages with the primary top page.');
	} else {
		const ids = new Set();
		const targets = new Set();
		for (const [index, referencePage] of referencePages.entries()) {
			const label = `referencePages[${index}]`;
			if (!referencePage?.id || ids.has(referencePage.id)) errors.push(`${label}.id must be unique.`);
			else ids.add(referencePage.id);
			try {
				const parsed = new URL(referencePage.url);
				if (!['http:', 'https:'].includes(parsed.protocol)) errors.push(`${label}.url must use http or https.`);
			} catch {
				errors.push(`${label}.url must be valid.`);
			}
			if (typeof referencePage.targetRoute !== 'string' || !referencePage.targetRoute.startsWith('/')) {
				errors.push(`${label}.targetRoute must start with '/'.`);
			} else if (targets.has(referencePage.targetRoute)) {
				errors.push(`Duplicate reference targetRoute: ${referencePage.targetRoute}`);
			} else targets.add(referencePage.targetRoute);
		}
		const primary = referencePages.filter((referencePage) => referencePage.primary === true);
		if (primary.length !== 1) errors.push('referencePages must contain exactly one primary page.');
		else {
			if (primary[0].url !== referenceUrl) errors.push('The primary reference page URL must equal referenceUrl.');
			if (primary[0].targetRoute !== '/') errors.push("The primary reference page must target '/'.");
		}
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
		for (const referencePage of referencePages ?? []) {
			if (!routes.has(referencePage.targetRoute)) {
				errors.push(`Reference page ${referencePage.id} targets a route missing from the sitemap: ${referencePage.targetRoute}`);
			}
		}
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
