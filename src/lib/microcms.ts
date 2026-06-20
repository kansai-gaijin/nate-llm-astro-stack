import { createClient } from 'microcms-js-sdk';

type MicroCMSClient = ReturnType<typeof createClient>;

let client: MicroCMSClient | undefined;

export function hasMicroCMSConfig(): boolean {
	return Boolean(import.meta.env.MICROCMS_SERVICE_DOMAIN && import.meta.env.MICROCMS_API_KEY);
}

export function getMicroCMSClient(): MicroCMSClient {
	if (client) return client;

	const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
	const apiKey = import.meta.env.MICROCMS_API_KEY;

	if (!serviceDomain || !apiKey) {
		throw new Error(
			'microCMS is not configured. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY in .env.',
		);
	}

	const configuredClient = createClient({ serviceDomain, apiKey });
	client = configuredClient;
	return configuredClient;
}
