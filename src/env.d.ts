/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_SITE_URL?: string;
	readonly PUBLIC_GTM_CONTAINER_ID?: string;
	readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
	readonly CONTENT_SOURCE?: 'markdown' | 'microcms';
	readonly CONTENT_FALLBACK_TO_MARKDOWN?: string;
	readonly MICROCMS_SERVICE_DOMAIN?: string;
	readonly MICROCMS_API_KEY?: string;
	readonly MICROCMS_MANAGEMENT_API_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
