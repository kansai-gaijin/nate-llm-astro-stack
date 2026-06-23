import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
for (const relative of ['src/pages/__clone', 'public/clone-temp']) {
	const absolute = path.join(root, relative);
	if (fs.existsSync(absolute) && fs.readdirSync(absolute).length > 0) {
		errors.push(`Temporary clone material must be removed before shipping: ${relative}`);
	}
}
if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}
console.log('No temporary reference clone routes or assets will ship.');
