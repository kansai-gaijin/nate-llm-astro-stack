export const siteConfig = {
	name: 'Astro Design Loop Starter',
	description: 'A reference-driven Astro website starter.',
	// Sites built from this template are primarily Japanese. `locale` sets <html lang>
	// and og:locale; change it only when a specific site is not Japanese.
	locale: 'ja',
	themeColor: '#ffffff',
	fonts: {
		stylesheetUrl:
			'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
		family: "'Noto Sans JP', sans-serif",
	},
} as const;
