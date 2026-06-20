import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const referenceRoot = path.resolve(process.env.REFERENCE_CAPTURE_DIR ?? 'artifacts/reference');
const implementationRoot = path.resolve(process.env.IMPLEMENTATION_CAPTURE_DIR ?? 'artifacts/implementation');
const diffRoot = path.resolve(process.env.DIFF_CAPTURE_DIR ?? 'artifacts/diff');

function pngFiles(directory, base = directory) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory()
			? pngFiles(entryPath, base)
			: entry.name.endsWith('.png')
				? [path.relative(base, entryPath)]
				: [];
	});
}

const files = pngFiles(referenceRoot);
if (files.length === 0) throw new Error('No reference PNG files found. Run npm run qa:capture:reference first.');

fs.mkdirSync(diffRoot, { recursive: true });
const report = [];

for (const relativePath of files) {
	const referencePath = path.join(referenceRoot, relativePath);
	const implementationPath = path.join(implementationRoot, relativePath);
	if (!fs.existsSync(implementationPath)) {
		report.push({ file: relativePath, status: 'missing-implementation' });
		continue;
	}

	const reference = PNG.sync.read(fs.readFileSync(referencePath));
	const implementation = PNG.sync.read(fs.readFileSync(implementationPath));
	if (reference.width !== implementation.width || reference.height !== implementation.height) {
		report.push({
			file: relativePath,
			status: 'dimension-mismatch',
			reference: [reference.width, reference.height],
			implementation: [implementation.width, implementation.height],
		});
		continue;
	}

	const diff = new PNG({ width: reference.width, height: reference.height });
	const differentPixels = pixelmatch(
		reference.data,
		implementation.data,
		diff.data,
		reference.width,
		reference.height,
		{ threshold: 0.1, includeAA: false },
	);
	const totalPixels = reference.width * reference.height;
	const outputPath = path.join(diffRoot, relativePath);
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, PNG.sync.write(diff));
	report.push({
		file: relativePath,
		status: 'compared',
		differentPixels,
		totalPixels,
		differenceRatio: Number((differentPixels / totalPixels).toFixed(6)),
		similarity: Number((1 - differentPixels / totalPixels).toFixed(6)),
	});
}

fs.writeFileSync(path.join(diffRoot, 'visual-report.json'), `${JSON.stringify(report, null, 2)}\n`);
const compared = report.filter((entry) => entry.status === 'compared');
const meanSimilarity = compared.length
	? compared.reduce((sum, entry) => sum + entry.similarity, 0) / compared.length
	: 0;
console.log(`Compared ${compared.length}/${files.length} capture(s). Mean pixel similarity: ${(meanSimilarity * 100).toFixed(2)}%.`);
console.log('Treat pixel similarity as diagnostic evidence; content and approved font substitutions require auditor judgment.');
