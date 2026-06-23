import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const referenceRoot = path.resolve(process.env.REFERENCE_CAPTURE_DIR ?? 'artifacts/clone/reference');
const implementationRoot = path.resolve(process.env.IMPLEMENTATION_CAPTURE_DIR ?? 'artifacts/clone/implementation');
const diffRoot = path.resolve(process.env.DIFF_CAPTURE_DIR ?? 'artifacts/clone/diff');
const acceptance = JSON.parse(fs.readFileSync(path.resolve('workflow/acceptance.json'), 'utf8'));
const referenceMetadataPath = path.join(referenceRoot, 'metadata.json');
const implementationMetadataPath = path.join(implementationRoot, 'metadata.json');
const referenceMetadata = fs.existsSync(referenceMetadataPath) ? JSON.parse(fs.readFileSync(referenceMetadataPath, 'utf8')) : [];
const implementationMetadata = fs.existsSync(implementationMetadataPath) ? JSON.parse(fs.readFileSync(implementationMetadataPath, 'utf8')) : [];

function metadataKey(entry) {
	return `${entry.viewport}/${entry.page}/${entry.state}`;
}

const referenceMetadataByKey = new Map(referenceMetadata.map((entry) => [metadataKey(entry), entry]));
const implementationMetadataByKey = new Map(implementationMetadata.map((entry) => [metadataKey(entry), entry]));

function geometryComparison(relativePath, viewportWidth) {
	const [viewport, page, file] = relativePath.split(/[\\/]/);
	const state = file.replace(/\.png$/i, '');
	const key = `${viewport}/${page}/${state}`;
	const expected = referenceMetadataByKey.get(key)?.measurements ?? {};
	const actual = implementationMetadataByKey.get(key)?.measurements ?? {};
	const tolerance = Math.max(
		acceptance.fidelityThresholds?.majorGeometryTolerancePx ?? 8,
		viewportWidth * (acceptance.fidelityThresholds?.majorGeometryToleranceRatio ?? 0.01),
	);
	const measurements = Object.entries(expected).map(([id, box]) => {
		if (!actual[id]) return { id, status: 'missing-implementation' };
		const deltas = Object.fromEntries(
			['x', 'y', 'width', 'height'].map((property) => [property, Number((actual[id][property] - box[property]).toFixed(3))]),
		);
		return {
			id,
			status: Object.values(deltas).every((delta) => Math.abs(delta) <= tolerance) ? 'passed' : 'failed',
			deltas,
			tolerance,
		};
	});
	return {
		passed: measurements.every((measurement) => measurement.status === 'passed'),
		measurements,
	};
}

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
	const geometry = geometryComparison(relativePath, reference.width);
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
		geometryPassed: geometry.passed,
		geometry: geometry.measurements,
	});
}

fs.writeFileSync(path.join(diffRoot, 'visual-report.json'), `${JSON.stringify(report, null, 2)}\n`);
const compared = report.filter((entry) => entry.status === 'compared');
const meanSimilarity = compared.length
	? compared.reduce((sum, entry) => sum + entry.similarity, 0) / compared.length
	: 0;
console.log(`Compared ${compared.length}/${files.length} capture(s). Mean pixel similarity: ${(meanSimilarity * 100).toFixed(2)}%.`);
console.log('Treat pixel similarity as diagnostic evidence; content and approved font substitutions require auditor judgment.');
const incomplete = report.filter((entry) => entry.status !== 'compared');
if (incomplete.length > 0) {
	for (const entry of incomplete) console.error(`error: ${entry.status}: ${entry.file}`);
}
const geometryFailures = report.filter((entry) => entry.status === 'compared' && entry.geometryPassed === false);
if (geometryFailures.length > 0) {
	for (const entry of geometryFailures) console.error(`error: geometry mismatch: ${entry.file}`);
}
if (incomplete.length > 0 || geometryFailures.length > 0) process.exit(1);
