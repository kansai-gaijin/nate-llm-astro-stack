import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const project = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = [];

function major(specifier) {
	const match = String(specifier ?? '').match(/(\d+)/);
	return match ? Number(match[1]) : null;
}

if (major(project.dependencies?.astro) !== 7) errors.push('package.json must require Astro 7.');
if (major(project.dependencies?.['@astrojs/alpinejs']) !== 1) errors.push('@astrojs/alpinejs 1.x is required for Astro 7.');
if (major(project.devDependencies?.vite) !== 8) errors.push('Vite 8 must be explicit for Astro 7/Rolldown tooling.');
if (!String(project.engines?.node ?? '').includes('22.12') || !String(project.engines?.node ?? '').includes('<23')) {
	errors.push('Node engine must use the stable 22.12+ line; current Astro 7/Vite 8 crashes after builds on Windows Node 24.');
}
if (!project.scripts?.['loop:serve:start']?.includes('astro-agent-server.mjs')) errors.push('loop:serve:start must use the cross-platform Astro 7 agent launcher.');
for (const script of ['loop:serve:status', 'loop:serve:logs', 'loop:serve:stop']) {
	if (!project.scripts?.[script]?.includes('astro dev')) errors.push(`${script} must use Astro 7 native server commands.`);
}
const installedAstro = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', 'astro', 'package.json'), 'utf8')).version;
if (major(installedAstro) !== 7) errors.push(`Installed Astro is ${installedAstro}, expected 7.x.`);

if (errors.length) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}
console.log(`Astro ${installedAstro}, Vite 8, Alpine integration 1, and native agent-server commands are configured.`);
