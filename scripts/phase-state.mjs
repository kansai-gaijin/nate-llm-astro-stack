import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const statePath = path.join(root, 'workflow', 'phase-state.json');
const protectedBaselinePath = path.join(root, 'workflow', 'clone-protected-baseline.json');
const approvedClonePath = path.join(root, 'workflow', 'approved-clone-baseline.json');
const defaultLoop = { totalIterations: 0, batchIterations: 0, inProgress: false, awaitingFeedback: false, approved: false };

function readState() {
	const stored = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
	return {
		clone: { ...defaultLoop, ...stored.clone },
		adaptation: { unlocked: false, ...defaultLoop, ...stored.adaptation },
	};
}

function writeJson(file, value) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

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

function latestReceipt(phase, iteration) {
	const file = path.join(root, 'artifacts', phase, 'iterations', String(iteration).padStart(3, '0'), 'audit.json');
	if (!fs.existsSync(file)) throw new Error(`Missing required audit receipt: ${path.relative(root, file)}`);
	const receipt = JSON.parse(fs.readFileSync(file, 'utf8'));
	if (!Array.isArray(receipt.p0) || !Array.isArray(receipt.p1)) throw new Error('Audit receipt requires p0 and p1 arrays.');
	if (phase === 'clone') {
		for (const field of ['blankCaptures', 'missingCaptures', 'sectionCoverage', 'phaseBoundaryPassed', 'diffExitCode']) {
			if (receipt[field] === undefined) throw new Error(`Clone audit receipt requires ${field}.`);
		}
		const actuallyPassed = receipt.blankCaptures === 0 && receipt.missingCaptures === 0 &&
			receipt.sectionCoverage === 1 && receipt.phaseBoundaryPassed === true &&
			receipt.diffExitCode === 0 && receipt.p0.length === 0 && receipt.p1.length === 0;
		if (receipt.hardGatesPassed === true && !actuallyPassed) {
			throw new Error('Clone audit receipt claims success while objective gates are failing.');
		}
	} else if (phase === 'adaptation') {
		for (const field of ['contentCoverage', 'routesCoverage', 'referenceMaterialRemaining', 'brandSystemRecorded', 'phaseBoundaryPassed']) {
			if (receipt[field] === undefined) throw new Error(`Adaptation audit receipt requires ${field}.`);
		}
		const actuallyPassed = receipt.contentCoverage === 1 && receipt.routesCoverage === 1 &&
			receipt.referenceMaterialRemaining === 0 && receipt.brandSystemRecorded === true &&
			receipt.phaseBoundaryPassed === true && receipt.p0.length === 0 && receipt.p1.length === 0;
		if (receipt.hardGatesPassed === true && !actuallyPassed) {
			throw new Error('Adaptation audit receipt claims success while objective gates are failing.');
		}
	}
	return receipt;
}

const [command = 'status', phaseName, decision] = process.argv.slice(2);
const state = readState();

if (command === 'status') {
	console.log(JSON.stringify(state, null, 2));
	process.exit(0);
}
if (!['clone', 'adaptation'].includes(phaseName)) throw new Error('Phase must be clone or adaptation.');
const phase = state[phaseName];

if (command === 'begin') {
	if (phaseName === 'adaptation' && (!state.clone.approved || !phase.unlocked)) {
		throw new Error('Adaptation is locked until the user explicitly approves the clone loop.');
	}
	if (phase.approved) throw new Error(`${phaseName} is already user-approved.`);
	if (phase.awaitingFeedback) throw new Error(`${phaseName} requires user feedback before another iteration.`);
	if (phase.inProgress) throw new Error(`${phaseName} iteration is already in progress.`);
	if (phaseName === 'clone' && phase.totalIterations === 0 && !fs.existsSync(protectedBaselinePath)) {
		writeJson(protectedBaselinePath, snapshot(protectedFiles()));
	}
	phase.inProgress = true;
	writeJson(statePath, state);
	const iteration = phase.totalIterations + 1;
	fs.mkdirSync(path.join(root, 'artifacts', phaseName, 'iterations', String(iteration).padStart(3, '0')), { recursive: true });
	console.log(`${phaseName} iteration ${iteration} started.`);
} else if (command === 'complete') {
	if (!phase.inProgress) throw new Error(`No ${phaseName} iteration is in progress.`);
	const iteration = phase.totalIterations + 1;
	const receipt = latestReceipt(phaseName, iteration);
	if (receipt.phase !== phaseName || receipt.iteration !== iteration) throw new Error('Audit receipt phase/iteration mismatch.');
	phase.inProgress = false;
	phase.totalIterations = iteration;
	phase.batchIterations += 1;
	if (phase.batchIterations >= 3) phase.awaitingFeedback = true;
	writeJson(statePath, state);
	console.log(`${phaseName} iteration ${iteration} completed.`);
	if (phase.awaitingFeedback) console.log(`PAUSE: ask the user whether to continue or approve the ${phaseName} loop.`);
} else if (command === 'feedback') {
	if (!phase.awaitingFeedback) throw new Error('Feedback is accepted only after a three-iteration batch.');
	if (decision === 'continue') {
		phase.awaitingFeedback = false;
		phase.batchIterations = 0;
	} else if (decision === 'approved') {
		const receipt = latestReceipt(phaseName, phase.totalIterations);
		if (receipt.hardGatesPassed !== true) throw new Error(`Cannot approve ${phaseName}: latest hard gates did not pass.`);
		phase.awaitingFeedback = false;
		phase.approved = true;
		if (phaseName === 'clone') {
			state.adaptation.unlocked = true;
			writeJson(approvedClonePath, snapshot(cloneFiles()));
		}
	} else throw new Error('Use feedback <phase> continue or approved.');
	writeJson(statePath, state);
	console.log(`User feedback recorded for ${phaseName}: ${decision}.`);
} else {
	throw new Error('Use status, begin <phase>, complete <phase>, or feedback <phase> <continue|approved>.');
}
