import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';

const root = process.cwd();
const command = process.argv[2] ?? 'start';
const port = Number(process.env.LOOP_DEV_PORT ?? 4321);
const host = '127.0.0.1';
const url = `http://${host}:${port}`;
const astroEntry = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const dotAstro = path.join(root, '.astro');
const lockPath = path.join(dotAstro, 'dev.json');
const logPath = path.join(dotAstro, 'dev.log');

if (command !== 'start') throw new Error('Use astro-agent-server.mjs start. Status, logs, and stop use Astro native commands directly.');

function alive(pid) {
	try { process.kill(pid, 0); return true; } catch { return false; }
}

function portInUse() {
	return new Promise((resolve) => {
		const socket = net.createConnection({ host, port });
		socket.setTimeout(800);
		socket.once('connect', () => { socket.destroy(); resolve(true); });
		socket.once('timeout', () => { socket.destroy(); resolve(false); });
		socket.once('error', () => resolve(false));
	});
}

if (fs.existsSync(lockPath)) {
	try {
		const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
		if (alive(lock.pid)) {
			console.log(JSON.stringify({ level: 'info', message: 'Dev server already running.', ...lock }));
			process.exit(0);
		}
	} catch { /* stale or malformed */ }
	fs.rmSync(lockPath, { force: true });
}
if (await portInUse()) throw new Error(`${url} is already occupied by an unmanaged process. Stop it or set LOOP_DEV_PORT to a free port.`);

if (process.platform !== 'win32') {
	const result = spawnSync(process.execPath, [astroEntry, 'dev', '--background', '--host', host, '--port', String(port), '--json'], {
		cwd: root,
		stdio: 'inherit',
		env: process.env,
	});
	process.exit(result.status ?? 1);
}

// Astro 7.0.0's background launcher resolves node_modules/.bin/astro, which is an extensionless
// shell shim and cannot be spawned directly on Windows. Start the same Astro entrypoint detached;
// ASTRO_DEV_BACKGROUND makes Astro own the standard lockfile, logs, status, health, and stop flow.
fs.mkdirSync(dotAstro, { recursive: true });
const logFd = fs.openSync(logPath, 'w');
const child = spawn(process.execPath, [astroEntry, 'dev', '--host', host, '--port', String(port), '--json'], {
	cwd: root,
	detached: true,
	stdio: ['ignore', logFd, logFd],
	env: { ...process.env, ASTRO_DEV_BACKGROUND: '1' },
});
child.unref();
fs.closeSync(logFd);
if (!child.pid) throw new Error('Failed to launch the Astro 7 background server.');

const deadline = Date.now() + 30_000;
let ready = false;
while (Date.now() < deadline) {
	if (!alive(child.pid)) throw new Error(`Astro dev exited before readiness. Inspect ${path.relative(root, logPath)}.`);
	try {
		const lock = fs.existsSync(lockPath) ? JSON.parse(fs.readFileSync(lockPath, 'utf8')) : null;
		const healthUrl = lock?.pid === child.pid ? `${lock.url}/_astro/status` : `${url}/_astro/status`;
		const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1_000) });
		if (response.ok) { ready = true; break; }
	} catch { /* still starting */ }
	await new Promise((resolve) => setTimeout(resolve, 200));
}
if (!ready) {
	try { process.kill(child.pid, 'SIGTERM'); } catch { /* already gone */ }
	fs.rmSync(lockPath, { force: true });
	throw new Error(`Astro dev did not become ready within 30 seconds. Inspect ${path.relative(root, logPath)}.`);
}
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
console.log(JSON.stringify({ level: 'info', message: 'Dev server running.', ...lock }));
