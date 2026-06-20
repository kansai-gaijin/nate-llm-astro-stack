import type { MicroCMSQueries } from 'microcms-js-sdk';

export interface ContentEntry {
	id: string;
	createdAt?: string;
	updatedAt?: string;
	publishedAt?: string;
	revisedAt?: string;
	[key: string]: unknown;
}

export interface ContentListResult<T extends ContentEntry> {
	contents: T[];
	totalCount: number;
	offset: number;
	limit: number;
}

export type ContentQueries = MicroCMSQueries;

export type ContentSourceMode = 'markdown' | 'microcms';
