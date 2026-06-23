import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const command = process.argv[2];
const root = process.cwd();
const host = process.env.LOOP_DEV_HOST ?? '127.0.0.1';
const port = Number(process.env.LOOP_DEV_PORT ?? 4321);
const url = `http://${host}:${port}`;
const runtimeDirectory = path.join(root, 'artifacts', 'runtime');
const statePath = path.join(runtimeDirectory, `dev-server-${port}.json`);
const logPath = path.join(runtimeDirectory, `dev-server-${port}.log`);

async function reachable() {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(1_500) });
		return response.ok;
	} catch {
		return false;
	}
}

function state() {
	if (!fs.existsSync(statePath)) return undefined;
	try {
		return JSON.parse(fs.readFileSync(statePath, 'utf8'));
	} catch {
		return undefined;
	}
}

async function start() {
	const existing = state();
	if (await reachable()) {
		if (existing?.pid) {
			console.log(`Managed Astro dev server is already running at ${url} (PID ${existing.pid}).`);
			return;
		}
		throw new Error(`${url} is already in use by an unmanaged process. Stop it or choose LOOP_DEV_PORT.`);
	}

	fs.mkdirSync(runtimeDirectory, { recursive: true });
	const astroCli = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
	if (!fs.existsSync(astroCli)) throw new Error('Astro is not installed. Run npm install first.');
	const log = fs.openSync(logPath, 'a');
	const child = spawn(process.execPath, [astroCli, 'dev', '--force', '--host', host, '--port', String(port)], {
		cwd: root,
		detached: true,
		stdio: ['ignore', log, log],
	});
	child.unref();
	fs.closeSync(log);
	fs.writeFileSync(statePath, `${JSON.stringify({ pid: child.pid, url, startedAt: new Date().toISOString() }, null, 2)}\n`);

	for (let attempt = 0; attempt < 60; attempt += 1) {
		if (await reachable()) {
			console.log(`Managed Astro dev server started at ${url} (PID ${child.pid}).`);
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	try { process.kill(child.pid, 'SIGTERM'); } catch {}
	fs.rmSync(statePath, { force: true });
	throw new Error(`Astro dev server did not become ready. Inspect ${logPath}.`);
}

async function stop() {
	const existing = state();
	if (!existing?.pid) {
		if (await reachable()) throw new Error(`${url} is running but is not owned by this orchestrator.`);
		console.log('No managed Astro dev server is running.');
		return;
	}
	try {
		process.kill(existing.pid, 'SIGTERM');
	} catch (error) {
		if (error.code !== 'ESRCH') throw error;
	}
	for (let attempt = 0; attempt < 20 && await reachable(); attempt += 1) {
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	fs.rmSync(statePath, { force: true });
	if (await reachable()) throw new Error(`Managed process ${existing.pid} did not release ${url}.`);
	console.log(`Managed Astro dev server stopped (PID ${existing.pid}).`);
}

async function status() {
	const existing = state();
	const live = await reachable();
	console.log(JSON.stringify({ managed: Boolean(existing?.pid), live, pid: existing?.pid ?? null, url }, null, 2));
	if (existing?.pid && !live) process.exitCode = 1;
}

if (command === 'start') await start();
else if (command === 'stop') await stop();
else if (command === 'status') await status();
else throw new Error('Use dev-server.mjs start, status, or stop.');
