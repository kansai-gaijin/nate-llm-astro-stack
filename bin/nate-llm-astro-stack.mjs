#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

function flagValue(name) {
	const direct = argv.find((argument) => argument.startsWith(`${name}=`));
	if (direct) return direct.slice(name.length + 1);
	const index = argv.indexOf(name);
	return index >= 0 ? argv[index + 1] : undefined;
}

function hasFlag(name) {
	return argv.includes(name);
}

function help() {
	console.log(`nate-llm-astro-stack [directory] [options]

Options:
  --hosting <cloudflare-pages|static>
  --content <markdown|microcms-fallback|microcms-required>
  --motion <auto|css|gsap|three>
  --yes              Accept recommended defaults
  --no-install       Do not install npm dependencies
  --no-git           Do not initialize a new Git repository
  --help              Show this help`);
}

if (hasFlag('--help') || hasFlag('-h')) {
	help();
	process.exit(0);
}

const positional = argv.find((argument, index) => {
	if (argument.startsWith('-')) return false;
	return index === 0 || !argv[index - 1]?.startsWith('--');
});
const yes = hasFlag('--yes') || hasFlag('-y');
const interactive = process.stdin.isTTY && process.stdout.isTTY && !yes;
const prompt = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : undefined;

async function ask(question, defaultValue) {
	if (!prompt) return defaultValue;
	const answer = (await prompt.question(`${question} (${defaultValue}): `)).trim();
	return answer || defaultValue;
}

async function choose(question, options, defaultIndex = 0) {
	if (!prompt) return options[defaultIndex].value;
	console.log(`\n${question}`);
	options.forEach((option, index) => console.log(`  ${index + 1}. ${option.label}${index === defaultIndex ? ' (recommended)' : ''}`));
	const answer = await ask('Choose a number', String(defaultIndex + 1));
	const selected = Number(answer) - 1;
	if (!Number.isInteger(selected) || !options[selected]) throw new Error(`Invalid selection: ${answer}`);
	return options[selected].value;
}

async function confirm(question, defaultValue = true) {
	if (!prompt) return defaultValue;
	const suffix = defaultValue ? 'Y/n' : 'y/N';
	const answer = (await prompt.question(`${question} (${suffix}): `)).trim().toLowerCase();
	if (!answer) return defaultValue;
	return answer === 'y' || answer === 'yes';
}

function assertChoice(name, value, allowed) {
	if (!allowed.includes(value)) throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
	return value;
}

function packageName(value) {
	const normalized = value.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
	return normalized || 'astro-site';
}

async function main() {
	const targetInput = positional ?? (await ask('Project directory', 'my-astro-site'));
	const target = path.resolve(targetInput);
	if (target === packageRoot) throw new Error('Choose a new project directory, not the template source.');
	if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
		throw new Error(`Target directory is not empty: ${target}`);
	}

	const hosting = assertChoice(
		'hosting',
		flagValue('--hosting') ??
			(await choose('Where will this site be hosted?', [
				{ label: 'Cloudflare Pages with GitHub integration', value: 'cloudflare-pages' },
				{ label: 'Generic static hosting', value: 'static' },
			])),
		['cloudflare-pages', 'static'],
	);
	const content = assertChoice(
		'content',
		flagValue('--content') ??
			(await choose('How should dynamic content work?', [
				{ label: 'microCMS with automatic Markdown fallback', value: 'microcms-fallback' },
				{ label: 'Markdown only', value: 'markdown' },
				{ label: 'microCMS required (no fallback)', value: 'microcms-required' },
			])),
		['markdown', 'microcms-fallback', 'microcms-required'],
	);
	const motion = assertChoice(
		'motion',
		flagValue('--motion') ??
			(await choose('Which advanced motion dependencies should be preinstalled?', [
				{ label: 'Inspect the reference first, then choose exact motion tools', value: 'auto' },
				{ label: 'CSS and Alpine only', value: 'css' },
				{ label: 'GSAP', value: 'gsap' },
				{ label: 'GSAP and Three.js', value: 'three' },
			])),
		['auto', 'css', 'gsap', 'three'],
	);
	const install = hasFlag('--no-install') ? false : await confirm('Install dependencies now?', true);
	const initializeGit = hasFlag('--no-git') ? false : await confirm('Initialize a fresh Git repository?', true);

	fs.mkdirSync(target, { recursive: true });
	const entries = [
		'.agents', '.claude', '.codex', '.github', 'content', 'deployment', 'media', 'microcms',
		'public', 'scripts', 'src', 'tests', 'workflow', '.env.example', 'AGENTS.md', 'CLAUDE.md',
		'.nvmrc', 'astro.config.mjs', 'playwright.config.ts', 'README.md', 'tsconfig.json', 'LICENSE',
	];
	for (const entry of entries) {
		const source = path.join(packageRoot, entry);
		if (!fs.existsSync(source)) continue;
		fs.cpSync(source, path.join(target, entry), {
			recursive: true,
			filter: (sourcePath) => !sourcePath.endsWith(path.join('.github', 'workflows', 'publish-package.yml')),
		});
	}
	fs.copyFileSync(path.join(packageRoot, 'scaffold', 'gitignore'), path.join(target, '.gitignore'));

	const sourcePackage = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
	const generatedPackage = {
		...sourcePackage,
		name: packageName(path.basename(target)),
		version: '0.1.0',
		private: true,
		description: 'Astro 7 website generated through separate clone, content-design, and update loops.',
	};
	delete generatedPackage.bin;
	delete generatedPackage.files;
	delete generatedPackage.publishConfig;
	for (const script of ['create:test', 'prepack']) delete generatedPackage.scripts[script];
	if (hosting === 'static') {
		delete generatedPackage.devDependencies.wrangler;
		delete generatedPackage.scripts['deploy:cloudflare'];
		fs.rmSync(path.join(target, 'deployment', 'cloudflare-pages.md'), { force: true });
	}
	if (motion === 'gsap' || motion === 'three') generatedPackage.dependencies.gsap = '^3.15.0';
	if (motion === 'three') {
		generatedPackage.dependencies.three = '^0.184.0';
		generatedPackage.devDependencies['@types/three'] = '^0.184.1';
	}
	fs.writeFileSync(path.join(target, 'package.json'), `${JSON.stringify(generatedPackage, null, 2)}\n`);

	const envPath = path.join(target, '.env.example');
	let env = fs.readFileSync(envPath, 'utf8');
	const source = content === 'markdown' ? 'markdown' : 'microcms';
	const fallback = content === 'microcms-required' ? 'false' : 'true';
	env = env.replace(/^CONTENT_SOURCE=.*$/m, `CONTENT_SOURCE=${source}`);
	env = env.replace(/^CONTENT_FALLBACK_TO_MARKDOWN=.*$/m, `CONTENT_FALLBACK_TO_MARKDOWN=${fallback}`);
	fs.writeFileSync(envPath, env);
	fs.writeFileSync(
		path.join(target, 'scaffold.config.json'),
		`${JSON.stringify({ hosting, content, motion }, null, 2)}\n`,
	);

	if (install) {
		// shell: true is required on Windows so Node can launch npm.cmd; without it,
		// Node 22.12+/24 reject spawning .cmd/.bat directly (CVE-2024-27980) with EINVAL.
		// The command is passed as a single literal string (no args array) to avoid the
		// DEP0190 warning; all arguments here are constant, so there is no injection risk.
		const result = spawnSync('npm install', { cwd: target, stdio: 'inherit', shell: true });
		if (result.error) throw result.error;
		if (result.status !== 0) throw new Error('npm install failed.');
	}
	if (initializeGit) {
		const init = spawnSync('git init', { cwd: target, stdio: 'inherit', shell: true });
		if (init.error) throw init.error;
		if (init.status !== 0) throw new Error('git init failed.');
		spawnSync('git branch -M main', { cwd: target, stdio: 'inherit', shell: true });
	}

	console.log(`\nCreated ${generatedPackage.name} in ${target}`);
	console.log('Next: configure referencePages and run astro-reference-clone; approve it, run astro-content-design-loop, then use astro-update-loop for later changes.');
	if (!install) console.log('Run npm install and npx playwright install chromium before testing.');
	if (hosting === 'cloudflare-pages') console.log('See deployment/cloudflare-pages.md for GitHub, Pages, and microCMS webhook setup.');
}

try {
	await main();
} finally {
	prompt?.close();
}
