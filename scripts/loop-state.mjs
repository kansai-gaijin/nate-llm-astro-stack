import fs from 'node:fs';
import path from 'node:path';

const statePath = path.resolve('workflow/loop-state.json');
const defaultState = {
	totalIterations: 0,
	batchIterations: 0,
	inProgress: false,
	awaitingFeedback: false,
	approved: false,
};

function readState() {
	return fs.existsSync(statePath)
		? { ...defaultState, ...JSON.parse(fs.readFileSync(statePath, 'utf8')) }
		: { ...defaultState };
}

function writeState(state) {
	fs.mkdirSync(path.dirname(statePath), { recursive: true });
	fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

const command = process.argv[2] ?? 'status';
const state = readState();

switch (command) {
	case 'begin': {
		if (state.approved) throw new Error('The user has approved the site. Start a new loop only on request.');
		if (state.awaitingFeedback) throw new Error('Three iterations are complete. User feedback is required before continuing.');
		if (state.inProgress) throw new Error('An iteration is already in progress.');
		state.inProgress = true;
		writeState(state);
		fs.mkdirSync(path.resolve('artifacts', 'iterations', String(state.totalIterations + 1).padStart(3, '0')), { recursive: true });
		console.log(`Iteration ${state.totalIterations + 1} started.`);
		break;
	}
	case 'complete': {
		if (!state.inProgress) throw new Error('No iteration is in progress.');
		state.inProgress = false;
		state.totalIterations += 1;
		state.batchIterations += 1;
		if (state.batchIterations >= 3) state.awaitingFeedback = true;
		writeState(state);
		console.log(`Iteration ${state.totalIterations} completed.`);
		if (state.awaitingFeedback) console.log('PAUSE: three iterations are complete; ask the user for feedback.');
		break;
	}
	case 'feedback': {
		const decision = process.argv[3];
		if (!state.awaitingFeedback) throw new Error('Feedback is only recorded after a three-iteration batch.');
		if (decision === 'continue') {
			state.awaitingFeedback = false;
			state.batchIterations = 0;
		} else if (decision === 'approved') {
			state.awaitingFeedback = false;
			state.approved = true;
		} else {
			throw new Error('Use feedback continue or feedback approved.');
		}
		writeState(state);
		console.log(`User feedback recorded: ${decision}.`);
		break;
	}
	case 'status':
		console.log(JSON.stringify(state, null, 2));
		break;
	default:
		throw new Error('Use begin, complete, status, or feedback <continue|approved>.');
}
