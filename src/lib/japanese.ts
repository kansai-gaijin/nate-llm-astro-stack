import { loadDefaultJapaneseParser } from 'budoux';

// Instantiate the BudouX parser once and reuse it. This runs only at build time
// (Astro frontmatter / SSR), so its weight never reaches the browser.
const parser = loadDefaultJapaneseParser();

/**
 * Split Japanese text into natural phrase (文節) segments. Rendering these with
 * `<wbr>` between them plus `word-break: keep-all` lets the browser break lines
 * only at phrase boundaries, so kanji compounds are never split at ugly points —
 * and it works in every browser, not just the Chromium `word-break: auto-phrase`.
 */
export function toPhrases(text: string): string[] {
	return parser.parse(text);
}
