import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-design-loop-create-'));

function create(name, options) {
	const target = path.join(temporaryRoot, name);
	const result = spawnSync(
		process.execPath,
		[path.join(root, 'bin', 'nate-llm-astro-stack.mjs'), target, '--yes', '--no-install', '--no-git', ...options],
		{ cwd: root, encoding: 'utf8' },
	);
	if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
	return target;
}

try {
	const staticProject = create('static-site', ['--hosting', 'static', '--content', 'markdown', '--motion', 'gsap']);
	const staticPackage = JSON.parse(fs.readFileSync(path.join(staticProject, 'package.json'), 'utf8'));
	if (!staticPackage.private || !staticPackage.dependencies.gsap) throw new Error('Static GSAP project was not configured.');
	if (staticPackage.devDependencies.wrangler) throw new Error('Static project retained Wrangler.');
	if (fs.existsSync(path.join(staticProject, 'deployment', 'cloudflare-pages.md'))) throw new Error('Static project retained Cloudflare guide.');
	if (!fs.existsSync(path.join(staticProject, '.gitignore'))) throw new Error('Generated .gitignore is missing.');
	for (const required of [
		'workflow/reference-manifest.json',
		'workflow/motion-manifest.json',
		'workflow/phase-state.json',
		'workflow/clone-assets.json',
		'scripts/validate-reference.mjs',
		'scripts/validate-phase.mjs',
		'scripts/validate-clone-assets.mjs',
		'scripts/validate-shipping.mjs',
		'scripts/phase-state.mjs',
		'scripts/validate-artifacts.mjs',
		'scripts/dev-server.mjs',
		'.codex/agents/reference-forensics.toml',
		'.codex/agents/clone-builder.toml',
		'.claude/agents/reference-forensics.md',
		'.claude/agents/clone-builder.md',
		'.agents/skills/astro-reference-clone/SKILL.md',
		'.agents/skills/astro-content-adaptation/SKILL.md',
		'.claude/skills/astro-reference-clone/SKILL.md',
		'.claude/skills/astro-content-adaptation/SKILL.md',
	]) {
		if (!fs.existsSync(path.join(staticProject, required))) throw new Error(`Generated project is missing ${required}.`);
	}
	if (!staticPackage.scripts['loop:serve:start'] || !staticPackage.scripts['loop:serve:stop']) {
		throw new Error('Generated project is missing orchestrator-owned dev-server scripts.');
	}
	const phaseCheck = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-phase.mjs')], {
		cwd: staticProject,
		encoding: 'utf8',
	});
	if (phaseCheck.status !== 0) throw new Error('Generated phase boundary template did not validate.');
	const prematureAdaptation = spawnSync(process.execPath, [path.join(root, 'scripts', 'phase-state.mjs'), 'begin', 'adaptation'], {
		cwd: staticProject,
		encoding: 'utf8',
	});
	if (prematureAdaptation.status === 0 || !prematureAdaptation.stderr.includes('locked')) {
		throw new Error('Adaptation was not blocked before clone approval.');
	}
	const templateReferenceCheck = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-reference.mjs')], {
		cwd: staticProject,
		encoding: 'utf8',
	});
	if (templateReferenceCheck.status !== 0) throw new Error('Generated reference template did not validate.');
	const rogueCapture = path.join(staticProject, 'rogue-screenshot.png');
	fs.writeFileSync(rogueCapture, 'not-an-image');
	const artifactCheck = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-artifacts.mjs')], {
		cwd: staticProject,
		encoding: 'utf8',
	});
	fs.rmSync(rogueCapture, { force: true });
	if (artifactCheck.status === 0 || !artifactCheck.stderr.includes('rogue-screenshot.png')) {
		throw new Error('A root screenshot did not fail artifact validation.');
	}

	const overviewPath = path.join(staticProject, 'content', 'overview.md');
	fs.writeFileSync(overviewPath, fs.readFileSync(overviewPath, 'utf8').replace('https://example.com', 'https://example.org'));
	const unlockedReferenceCheck = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-reference.mjs')], {
		cwd: staticProject,
		encoding: 'utf8',
	});
	if (unlockedReferenceCheck.status === 0 || !unlockedReferenceCheck.stderr.includes('locked')) {
		throw new Error('A real reference URL did not require locked forensic evidence.');
	}

	const referenceManifestPath = path.join(staticProject, 'workflow', 'reference-manifest.json');
	const referenceManifest = JSON.parse(fs.readFileSync(referenceManifestPath, 'utf8'));
	referenceManifest.status = 'locked';
	referenceManifest.mediaDecision = { requiresVisualMedia: true, evidence: 'Reference hero contains video.' };
	referenceManifest.mediaRequirements = [{
		id: 'hero-video',
		type: 'video',
		route: '/',
		referenceAspectRatio: '16/9',
		replacementStrategy: 'royalty-free',
	}];
	fs.writeFileSync(referenceManifestPath, `${JSON.stringify(referenceManifest, null, 2)}\n`);
	const missingMediaCheck = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-media.mjs')], {
		cwd: staticProject,
		encoding: 'utf8',
	});
	if (missingMediaCheck.status === 0 || !missingMediaCheck.stderr.includes('hero-video')) {
		throw new Error('A required reference video did not fail when its replacement was missing.');
	}

	const cloudflareProject = create('cloudflare-site', ['--hosting', 'cloudflare-pages', '--content', 'microcms-fallback', '--motion', 'three']);
	const cloudflarePackage = JSON.parse(fs.readFileSync(path.join(cloudflareProject, 'package.json'), 'utf8'));
	if (!cloudflarePackage.devDependencies.wrangler || !cloudflarePackage.devDependencies.vite || !cloudflarePackage.dependencies.three) {
		throw new Error('Cloudflare Three.js project was not configured.');
	}
	if (!fs.existsSync(path.join(cloudflareProject, 'deployment', 'cloudflare-pages.md'))) {
		throw new Error('Cloudflare deployment guide is missing.');
	}
	const config = JSON.parse(fs.readFileSync(path.join(cloudflareProject, 'scaffold.config.json'), 'utf8'));
	if (config.content !== 'microcms-fallback') throw new Error('Scaffold choices were not persisted.');

	// Guard the generator's dependency-install spawn path without a full install. The generator
	// launches `npm install` with shell: true so Windows can run npm.cmd (Node 22.12+/24 reject
	// spawning .cmd/.bat directly, CVE-2024-27980). Spawning `npm --version` the same way proves
	// npm is launchable on this platform, catching that EINVAL regression class in seconds.
	const npmProbe = spawnSync('npm --version', { stdio: 'ignore', shell: true });
	if (npmProbe.error) throw npmProbe.error;
	if (npmProbe.status !== 0) throw new Error('npm is not launchable via the generator spawn path.');

	console.log('Generator variants are valid.');
} finally {
	fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
