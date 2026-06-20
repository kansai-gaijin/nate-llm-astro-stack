import { getMicroCMSClient, hasMicroCMSConfig } from '../microcms';
import { getMarkdownList, getMarkdownObject } from './markdown';
import type { ContentEntry, ContentListResult, ContentQueries, ContentSourceMode } from './types';

function configuredMode(): ContentSourceMode {
	return import.meta.env.CONTENT_SOURCE === 'microcms' ? 'microcms' : 'markdown';
}

function fallbackEnabled(): boolean {
	return import.meta.env.CONTENT_FALLBACK_TO_MARKDOWN?.toLowerCase() !== 'false';
}

export function getContentSourceMode(): ContentSourceMode {
	if (configuredMode() === 'microcms' && hasMicroCMSConfig()) return 'microcms';
	return 'markdown';
}

export async function getContentList<T extends ContentEntry>(
	endpoint: string,
	queries: ContentQueries = {},
): Promise<ContentListResult<T>> {
	if (configuredMode() === 'microcms') {
		try {
			if (!hasMicroCMSConfig()) throw new Error('microCMS credentials are not configured.');
			return await getMicroCMSClient().getList<T>({ endpoint, queries });
		} catch (error) {
			if (!fallbackEnabled()) throw error;
			console.warn(`microCMS list '${endpoint}' unavailable; using Markdown fallback.`, error);
		}
	}

	return getMarkdownList<T>(endpoint, queries);
}

export async function getContentObject<T extends ContentEntry>(endpoint: string): Promise<T> {
	if (configuredMode() === 'microcms') {
		try {
			if (!hasMicroCMSConfig()) throw new Error('microCMS credentials are not configured.');
			return await getMicroCMSClient().getObject<T>({ endpoint });
		} catch (error) {
			if (!fallbackEnabled()) throw error;
			console.warn(`microCMS object '${endpoint}' unavailable; using Markdown fallback.`, error);
		}
	}

	return getMarkdownObject<T>(endpoint);
}

export type { ContentEntry, ContentListResult, ContentQueries, ContentSourceMode } from './types';
