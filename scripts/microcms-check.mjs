import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
	process.loadEnvFile(envPath);
}

const manifestArgumentIndex = process.argv.indexOf('--manifest');
const manifestPath = manifestArgumentIndex >= 0
	? path.resolve(process.argv[manifestArgumentIndex + 1])
	: path.join(root, 'microcms', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const endpoints = manifest.endpoints ?? [];

if (!Array.isArray(endpoints)) {
	throw new Error('microcms/manifest.json must contain an endpoints array.');
}

if (endpoints.length === 0) {
	console.log('No microCMS endpoints are declared. Nothing to check.');
	process.exit(0);
}

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const managementKey = process.env.MICROCMS_MANAGEMENT_API_KEY || process.env.MICROCMS_API_KEY;

function printManualSetup(entries, reason) {
	console.error(`microCMS requires manual schema import: ${reason}`);
	for (const endpoint of entries) {
		console.error(`\n- Create API: ${endpoint.name} (${endpoint.endpoint}, ${endpoint.type})`);
		console.error(`  Import schema: microcms/schemas/${endpoint.schema}`);
	}
	console.error(
		'\nIn the microCMS dashboard, create each API, choose its format, then use the schema import link on the schema definition screen. Re-run npm run microcms:check afterward.',
	);
}

for (const endpoint of endpoints) {
	if (!endpoint.name || !endpoint.endpoint || !['list', 'object'].includes(endpoint.type) || !endpoint.schema) {
		throw new Error('Every manifest endpoint requires name, endpoint, type (list|object), and schema.');
	}
	const schemaPath = path.join(root, 'microcms', 'schemas', endpoint.schema);
	if (!fs.existsSync(schemaPath)) throw new Error(`Missing schema file: ${schemaPath}`);
	JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

if (!serviceDomain || !managementKey) {
	printManualSetup(endpoints, 'MICROCMS_SERVICE_DOMAIN or a Management-API-capable key is missing.');
	process.exit(2);
}

const baseUrl = `https://${serviceDomain}.microcms-management.io/api/v1`;
const headers = { 'X-MICROCMS-API-KEY': managementKey };

async function getJson(url) {
	const response = await fetch(url, { headers });
	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
	}
	return response.json();
}

let remoteApis;
try {
	remoteApis = (await getJson(`${baseUrl}/apis`)).apis ?? [];
} catch (error) {
	printManualSetup(endpoints, `Management API inspection failed (${error.message}).`);
	process.exit(2);
}

const missing = endpoints.filter(
	(endpoint) =>
		!remoteApis.some(
			(remote) => remote.endpoint === endpoint.endpoint && remote.type === endpoint.type,
		),
);

if (missing.length > 0) {
	printManualSetup(
		missing,
		'the documented Management API supports API/schema retrieval but does not expose API creation.',
	);
	process.exit(2);
}

const mismatches = [];
for (const endpoint of endpoints) {
	const expected = JSON.parse(
		fs.readFileSync(path.join(root, 'microcms', 'schemas', endpoint.schema), 'utf8'),
	);
	const actual = await getJson(`${baseUrl}/apis/${encodeURIComponent(endpoint.endpoint)}`);
	const expectedFields = new Map((expected.apiFields ?? []).map((field) => [field.fieldId, field.kind]));
	const actualFields = new Map((actual.apiFields ?? []).map((field) => [field.fieldId, field.kind]));

	for (const [fieldId, kind] of expectedFields) {
		if (actualFields.get(fieldId) !== kind) {
			mismatches.push(`${endpoint.endpoint}.${fieldId}: expected ${kind}, got ${actualFields.get(fieldId) ?? 'missing'}`);
		}
	}
}

if (mismatches.length > 0) {
	console.error('microCMS schema mismatches:');
	for (const mismatch of mismatches) console.error(`- ${mismatch}`);
	process.exit(2);
}

console.log(`microCMS is ready: ${endpoints.length} endpoint(s) match the declared schemas.`);
