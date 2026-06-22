import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const overview = matter(fs.readFileSync(path.join(root, 'content', 'overview.md'), 'utf8')).data;
const plan = readJson('workflow/reference-plan.json');
const reference = readJson('workflow/reference-manifest.json');
const motion = readJson('workflow/motion-manifest.json');
const errors = [];

const requiredViewports = {
	'desktop-1920': (viewport) => viewport.width === 1920,
	'desktop-1440': (viewport) => viewport.width === 1440,
	tablet: (viewport) => viewport.width >= 700 && viewport.width <= 1100,
	'mobile-390': (viewport) => viewport.width === 390,
	'mobile-360': (viewport) => viewport.width === 360,
};

for (const [name, valid] of Object.entries(requiredViewports)) {
	const viewport = plan.viewports?.find((candidate) => candidate.name === name);
	if (!viewport || !valid(viewport)) errors.push(`reference-plan requires a valid ${name} viewport.`);
}

const placeholderReference = overview.referenceUrl === 'https://example.com';
const statuses = [plan.status, reference.status, motion.status];
if (placeholderReference) {
	if (statuses.some((status) => status !== 'template')) {
		errors.push('Placeholder content requires template status in all reference workflow files.');
	}
} else if (statuses.some((status) => status !== 'locked')) {
	errors.push('Set reference-plan, reference-manifest, and motion-manifest to locked after reference forensics.');
}

if (!placeholderReference) {
	if (reference.referenceUrl !== overview.referenceUrl) {
		errors.push('reference-manifest.referenceUrl must match content/overview.md.');
	}
	if (!reference.inspectedAt) errors.push('reference-manifest.inspectedAt is required.');
	for (const field of ['htmlEvidence', 'cssEvidence', 'jsEvidence', 'libraryEvidence']) {
		if (!reference.sourceInspection?.[field]?.length) {
			errors.push(`Record sourceInspection.${field} or an explicit none-observed entry.`);
		}
	}
	if (!reference.mediaDecision?.evidence) {
		errors.push('Record whether the reference requires image/video replacements and the supporting evidence.');
	}

	const plannedPaths = new Set((plan.pages ?? []).map((page) => page.path));
	const inspectedPaths = new Set((reference.pages ?? []).map((page) => page.path));
	for (const page of overview.pages ?? []) {
		if (!plannedPaths.has(page.path)) errors.push(`Missing capture plan for route: ${page.path}`);
		if (!inspectedPaths.has(page.path)) errors.push(`Missing reference forensics for route: ${page.path}`);
	}

	const home = plan.pages?.find((page) => page.path === '/');
	const homeKinds = new Set((home?.states ?? []).map((state) => state.kind));
	for (const kind of ['settled', 'navigation-hover', 'mobile-navigation-closed', 'mobile-navigation-open']) {
		if (!homeKinds.has(kind)) errors.push(`Homepage capture plan requires state kind: ${kind}`);
	}
	const statesForKind = (kind) => (home?.states ?? []).filter((state) => state.kind === kind);
	for (const viewport of ['desktop-1920', 'desktop-1440']) {
		if (!statesForKind('settled').some((state) => state.viewports?.includes(viewport))) {
			errors.push(`Homepage settled state must cover ${viewport}.`);
		}
	}
	if (!statesForKind('navigation-hover').some((state) => state.viewports?.includes('desktop-1920'))) {
		errors.push('Homepage navigation hover must be captured at desktop-1920.');
	}
	for (const kind of ['mobile-navigation-closed', 'mobile-navigation-open']) {
		for (const viewport of ['mobile-390', 'mobile-360']) {
			if (!statesForKind(kind).some((state) => state.viewports?.includes(viewport))) {
				errors.push(`${kind} must be captured at ${viewport}.`);
			}
		}
	}

	const motionIds = new Set((motion.interactions ?? []).map((interaction) => interaction.id));
	const referencedMotionIds = new Set();
	const capturedMotionSamples = new Map();
	const motionStates = new Map();
	for (const page of plan.pages ?? []) {
		for (const state of page.states ?? []) {
			if (state.implementationOnly && !state.approvedException) {
				errors.push(`${page.id}/${state.name} cannot be implementationOnly without an approved exception.`);
			}
			if (!state.viewports?.length) errors.push(`${page.id}/${state.name} must declare viewports.`);
			if (!state.readiness) errors.push(`${page.id}/${state.name} must declare readiness conditions.`);
			for (const action of state.actions ?? []) {
				if (['hover', 'click', 'scroll', 'seekAnimations'].includes(action.type)) {
					if (!action.referenceSelector || !action.implementationSelector) {
						errors.push(`${page.id}/${state.name} action ${action.type} requires paired selectors.`);
					}
				}
			}
			for (const measurement of state.measurements ?? []) {
				if (!measurement.id || !measurement.referenceSelector || !measurement.implementationSelector) {
					errors.push(`${page.id}/${state.name} measurements require id and paired selectors.`);
				}
			}
			if (['settled', 'mobile-navigation-closed', 'mobile-navigation-open'].includes(state.kind) &&
				(state.measurements?.length ?? 0) < 2) {
				errors.push(`${page.id}/${state.name} requires at least two geometry measurements.`);
			}
			if (state.motionId) {
				referencedMotionIds.add(state.motionId);
				if (!capturedMotionSamples.has(state.motionId)) capturedMotionSamples.set(state.motionId, new Set());
				if (!motionStates.has(state.motionId)) motionStates.set(state.motionId, []);
				motionStates.get(state.motionId).push(state);
				if (Number.isFinite(state.sampleMs)) capturedMotionSamples.get(state.motionId).add(state.sampleMs);
			}
		}
	}
	for (const id of motionIds) {
		if (!referencedMotionIds.has(id)) errors.push(`Motion interaction is not captured by reference-plan: ${id}`);
	}

	for (const interaction of motion.interactions ?? []) {
		for (const field of ['id', 'route', 'trigger', 'driver', 'referenceSelector', 'implementationSelector', 'durationMs', 'easing']) {
			if (interaction[field] === undefined || interaction[field] === '') {
				errors.push(`Motion interaction ${interaction.id ?? '<unnamed>'} requires ${field}.`);
			}
		}
		if (!Array.isArray(interaction.sampleTimesMs) || interaction.sampleTimesMs.length < 3) {
			errors.push(`Motion interaction ${interaction.id ?? '<unnamed>'} requires at least three sample times.`);
		} else {
			const samples = capturedMotionSamples.get(interaction.id) ?? new Set();
			for (const sample of interaction.sampleTimesMs) {
				if (!samples.has(sample)) errors.push(`Motion interaction ${interaction.id} is missing capture sample ${sample}ms.`);
			}
		}
		if (interaction.reverseRequired !== true || interaction.interruptionRequired !== true) {
			errors.push(`Motion interaction ${interaction.id ?? '<unnamed>'} must test reversal and interruption.`);
		}
		if (!['css-transition', 'web-animations', 'gsap', 'raf', 'native-scroll'].includes(interaction.driver)) {
			errors.push(`Motion interaction ${interaction.id ?? '<unnamed>'} has an unsupported driver.`);
		}
		if (['gsap', 'raf', 'native-scroll'].includes(interaction.driver)) {
			for (const state of motionStates.get(interaction.id) ?? []) {
				if (!state.expect?.computedStyles?.length) {
					errors.push(`${interaction.id}/${state.name} requires computedStyles for sampled ${interaction.driver} motion.`);
				}
				if (state.sampleMs === 0 && !state.expect?.reducedMotionStyles?.length) {
					errors.push(`${interaction.id}/${state.name} requires reducedMotionStyles.`);
				}
			}
		}
	}

	if (reference.navigation?.mobile?.exists !== false) {
		for (const field of ['referenceToggleSelector', 'implementationToggleSelector', 'referencePanelSelector', 'implementationPanelSelector']) {
			if (!reference.navigation?.mobile?.[field]) errors.push(`reference-manifest.navigation.mobile requires ${field}.`);
		}
	}
}

if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}

console.log(placeholderReference ? 'Reference workflow template is valid.' : 'Locked reference evidence is valid.');
