import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const statePath = path.join(root, 'workflow', 'update-state.json');
const baselinePath = path.join(root, 'workflow', 'update-baseline.json');
const phase = JSON.parse(fs.readFileSync(path.join(root, 'workflow', 'phase-state.json'), 'utf8'));
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

function writeJson(file, value) {
	fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function walk(directory) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const absolute = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(absolute) : [absolute];
	});
}

function trackedFiles() {
	return [
		...walk(path.join(root, 'src')),
		...walk(path.join(root, 'content')),
		...walk(path.join(root, 'public', 'media')),
		...walk(path.join(root, 'tests')),
		...walk(path.join(root, 'media')),
		path.join(root, 'package.json'),
		path.join(root, 'astro.config.mjs'),
		path.join(root, 'workflow', 'content-map.json'),
		path.join(root, 'workflow', 'design-adaptation.json'),
	].filter((file) => fs.existsSync(file));
}

function snapshot() {
	return Object.fromEntries(trackedFiles().sort().map((file) => [
		path.relative(root, file).replaceAll('\\', '/'),
		crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
	]));
}

function changedFiles(before, after) {
	return [...new Set([...Object.keys(before), ...Object.keys(after)])]
		.filter((file) => before[file] !== after[file])
		.sort();
}

const [command = 'status', requestId] = process.argv.slice(2);
if (command === 'status') {
	console.log(JSON.stringify(state, null, 2));
	process.exit(0);
}

if (command === 'begin') {
	if (!phase.adaptation?.approved) throw new Error('Update loop is locked until content-and-design adaptation is user-approved.');
	if (state.status === 'active') throw new Error(`Update request ${state.current?.id} is already active.`);
	if (!requestId || !/^[a-z0-9][a-z0-9-_]{1,63}$/i.test(requestId)) throw new Error('Provide a 2-64 character request ID using letters, numbers, hyphens, or underscores.');
	writeJson(baselinePath, snapshot());
	state.status = 'active';
	state.current = { id: requestId, startedAt: new Date().toISOString() };
	fs.mkdirSync(path.join(root, 'artifacts', 'update', 'requests', requestId), { recursive: true });
	writeJson(statePath, state);
	console.log(`Update request ${requestId} started.`);
} else if (command === 'complete') {
	if (state.status !== 'active' || !state.current?.id) throw new Error('No update request is active.');
	if (!fs.existsSync(baselinePath)) throw new Error('Missing update baseline. Restart the request through update:begin.');
	const auditPath = path.join(root, 'artifacts', 'update', 'requests', state.current.id, 'audit.json');
	if (!fs.existsSync(auditPath)) throw new Error(`Missing update audit receipt: ${path.relative(root, auditPath)}`);
	const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
	if (audit.requestId !== state.current.id || audit.hardGatesPassed !== true || audit.p0?.length || audit.p1?.length) {
		throw new Error('Update audit must match the request, pass hard gates, and contain empty p0/p1 arrays.');
	}
	if (!Array.isArray(audit.verification) || audit.verification.length === 0) throw new Error('Update audit requires verification results.');
	const actual = changedFiles(JSON.parse(fs.readFileSync(baselinePath, 'utf8')), snapshot());
	const claimed = [...(audit.changedFiles ?? [])].sort();
	if (JSON.stringify(actual) !== JSON.stringify(claimed)) throw new Error('Update audit changedFiles does not match the actual request diff.');
	state.status = 'idle';
	state.totalRequests = Number(state.totalRequests ?? 0) + 1;
	state.lastCompleted = { id: state.current.id, completedAt: new Date().toISOString(), changedFiles: actual };
	state.current = null;
	writeJson(statePath, state);
	fs.rmSync(baselinePath, { force: true });
	console.log(`Update request ${audit.requestId} completed.`);
} else {
	throw new Error('Use status, begin <request-id>, or complete.');
}
