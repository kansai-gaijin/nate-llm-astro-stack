# Astro Design Loop Starter

## Purpose

Build every route declared in `content/overview.md` from the approved Markdown copy while matching
the supplied reference URL as closely as practical. Invoke the `astro-design-loop` skill and its
project subagents for full site-generation work.

After the fidelity baseline is established, use user feedback to elevate the result into a
distinctive, award-worthy experience. Do not trade content clarity, accessibility, or performance
for spectacle.

## Stack invariants

- Use Astro, Alpine.js, strict TypeScript, Tailwind CSS, Google Fonts, and Iconify icons.
- Use microCMS only for content explicitly marked dynamic in `content/overview.md`.
- Do not add React, Vue, Svelte, another CSS framework, or a non-Google webfont.
- Keep secrets server-side. Only variables prefixed with `PUBLIC_` may reach browser code.
- Prefer Astro components and static HTML. Use Alpine only for client-side interaction.
- Add GSAP or Three.js only when the approved design direction materially benefits from them. Load
  either lazily and provide performance, mobile, static, and reduced-motion fallbacks.

## Content invariants

- Treat `content/overview.md` as the sitemap and scope authority.
- Treat `content/pages/*.md` as approved copy. Reorganize it when required by the design, but do not
  invent factual claims, testimonials, statistics, services, locations, or contact details.
- Implement `/` in every project. Implement other routes only when listed in the sitemap.
- Record unavoidable ambiguities and requested copy changes instead of silently rewriting them.

## Design and asset invariants

- Reproduce layout, hierarchy, color, spacing, responsiveness, motion, hover/focus behavior,
  loading states, and navigation behavior from the reference.
- Anything that moves must move fluidly. Abrupt transitions, linear motion, teleporting elements,
  jarring interruption, and ugly hover/animation states are defects.
- Choose the closest sensible Google Fonts alternative when the reference font is unavailable and
  record the choice in `workflow/font-map.json`.
- Do not copy logos, photography, video, or proprietary icons from the reference site.
- Generate new images through an available image-generation tool. If unavailable, create an asset
  brief and ask the user for generation or supply.
- When the reference or content calls for video, search for a close royalty-free replacement. Record
  the source URL, license URL, author, and retrieval date in `media/manifest.json`. If no suitable
  licensed video exists, document the searched sources and use an approved static/generated fallback.
- Use icons available through Iconify and record their collection/name in component code.

## Japanese typography invariants

Sites built from this template are primarily Japanese. Treat `ja` as the default `locale` in
`content/overview.md` and `src/config/site.ts`, and only deviate when a specific site is not Japanese.

- Japanese has no spaces, so browsers break lines between arbitrary characters and split kanji
  compounds at ugly, hard-to-read points. Breaking Japanese at sensible phrase boundaries is a
  hard requirement; awkward mid-word breaks are defects, exactly like abrupt motion.
- The baseline is already in `src/styles/global.css`: `line-break: strict` (kinsoku) and
  `word-break: auto-phrase` on `body`, plus `text-wrap: pretty` on headings. Keep these.
- `word-break: auto-phrase` only works in Chromium today. For headings, hero copy, navigation, and
  any short text that must never break ugly, guarantee phrase breaks across all browsers with
  BudouX-inserted `<wbr>` (or zero-width spaces) combined with the `.jp-phrase` / Tailwind
  `break-keep` class so breaks happen only at inserted opportunities.
- Use a Japanese-capable Google Font (default: Noto Sans JP). Do not substitute a Latin-only font.
- Auditors must check rendered Japanese line breaks at every breakpoint and flag split compounds,
  single-character last lines, and kinsoku violations as discrepancies.

## Agent protocol

- The main agent is the orchestrator and final decision-maker.
- `reference-designer` analyzes design, content architecture, font substitutions, and asset needs.
- `fixture-copywriter` creates synthetic Markdown test content and generated imagery for declared
  dynamic collections. It may edit content/media fixtures but not application code.
- `astro-builder` is the only subagent allowed to edit application code. Run one builder at a time.
- `visual-auditor` and `behavior-auditor` are read-only and may run in parallel after a build.
- Auditors return evidence and prioritized discrepancies; they do not fix their own findings.
- Run exactly three build-audit iterations, then pause for user feedback. Continue in batches of
  three until the user explicitly approves the result.

## Required verification

Run these before reporting a batch complete:

```text
npm run content:validate
npm run dynamic:validate
npm run media:validate
npm run check
npm run build
npm run test:e2e
```

When microCMS endpoints are declared, also run `npm run microcms:check`. Use
`workflow/acceptance.json` and the current iteration evidence under `artifacts/` for audit claims.
