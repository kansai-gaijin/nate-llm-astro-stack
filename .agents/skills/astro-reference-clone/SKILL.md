---
name: astro-reference-clone
description: Build a literal, non-production Astro clone of explicitly listed reference URLs before any supplied site content is used. Use for the first phase of reference-driven work requiring HTML/CSS/JS forensics, original reference copy and temporary remote media, scroll-aware section capture, desktop/mobile visual matching, exact navigation and motion, and a three-iteration user approval gate.
---

# Astro Reference Clone

This phase has one objective: reproduce the reference as literally as practical. Do not adapt the
user's business, content, sitemap wording, logos, wireframes, brand colors, or replacement media.

Read only the frontmatter fields needed to obtain `referencePages`. Do not read or use
`content/pages`, `content/wireframes`, supporting brand documents, `public/media`, microCMS, or the
overview body. Run `npm run clone:begin` before delegating any write work.

## Isolation

Write clone code only under:

- `src/pages/__clone/<sourceId>.astro`;
- `src/components/clone/`;
- `src/styles/clone/`;
- `src/scripts/clone/`;
- `public/clone-temp/` for downloaded temporary reference media.

Reference-plan implementation paths must be `/__clone/<sourceId>`. Never edit final routes or
shared content components. `npm run phase:validate` enforces this boundary.

The clone is an internal QA artifact and must never ship. Use the reference's visible copy. Download
the exact images, posters, videos, SVGs, and other visual media needed for the listed pages into
`public/clone-temp/`; do not ask the user where to source clone media. Record source URL, local path,
requirement ID, checksum, and consuming clone files in `workflow/clone-assets.json`. Do not hotlink.
This temporary reference media is replaced and removed by the adaptation loop before shipping.
Record every substantial visible reference text block in `workflow/reference-copy.json`; this lets
the shipping gate prove that protected reference copy was removed from final routes.

## Reference preparation

Use `reference-forensics` on only the explicitly listed URLs. Treat delivered HTML, computed CSS,
and JavaScript as authoritative. Inventory every ordered section with a stable ID and selector.

Explicitly fan out independent page/section forensics to read-only subagents in the same turn. Opus
4.8 spawns fewer agents unless asked, so name each bounded investigation. Determine the interaction
model first (static, scroll-, click-, time-, or pointer-driven). Before any builder is dispatched,
the orchestrator must create a complete spec for every section under
`artifacts/clone/forensics/specs/<sourceId>/<sectionId>.json` containing target file, DOM topology,
recursive computed styles, layered assets, exact text, responsive geometry at all configured
viewports, every behavior/state and trigger, timing/easing, and unresolved evidence. If a builder
would need to guess, the spec is incomplete.

After inventorying stable section selectors, run `npm run qa:extract:reference`. This creates the
recursive DOM/computed-style baseline at every configured viewport. Resolve every
`unresolvedEvidence` entry by exercising the relevant states before locking forensics.

Capture every section separately at 1920 and 390 pixels, plus shared shell states at 1440, 768, 390,
and 360. A full-page screenshot is diagnostic only. Before settled/section captures:

1. wait for the loader to disappear and the real page-ready state to appear;
2. sweep-scroll from top to bottom to trigger lazy media and scroll reveals;
3. scroll the target section into the viewport and wait for layout/motion to settle;
4. reject captures that are blank, loader-only, or missing the target section.

Run `npm run reference:validate` and `npm run qa:capture:reference`. Do not start implementation if
capture exits nonzero. Review the actual PNGs, not only metadata or headings.

Run `npm run clone:assets:download`; it downloads every inventoried reference asset into
`public/clone-temp` and updates checksums. Do not ask the user and do not delegate asset sourcing.

## Clone iterations

Delegate `clone-builder` first for shared tokens, fonts, types, shell, and page foundation. Then
dispatch `clone-section-builder` agents for completed specs. Use isolated worktrees and disjoint
target files when the runtime supports them; otherwise run section builders sequentially. Never let
parallel builders edit shared foundation or page assembly. The clone builder integrates sections
and resolves discrepancies. Together they must copy DOM structure, text, section order,
geometry, responsive transformations, temporary reference media composition, navigation, hover,
loading, scroll, and motion. Convert observed CSS values exactly to Tailwind tokens/utilities or
arbitrary values; use focused CSS only where required. Do not simplify or reinterpret.

For every iteration run:

```text
npm run phase:validate
npm run reference:validate
npm run clone:assets:validate
npm run artifacts:validate
npm run check
npm run build
npm run test:e2e
npm run qa:capture:implementation
npm run qa:diff
```

Run read-only visual and behavior auditors. Create
`artifacts/clone/iterations/NNN/audit.json` with the correct phase/iteration and
`hardGatesPassed`. It must be false when any capture is blank/missing, section coverage is below
100%, diff reports dimension/geometry failures, behavior differs, or clone files use supplied
content.

Finish through `npm run clone:complete`. After exactly three iterations, stop and ask the user to
continue or approve. Only after explicit approval and a passing receipt may the orchestrator run:

```text
node scripts/phase-state.mjs feedback clone approved
```

Never start content adaptation in this invocation. After approval, tell the user to start
`$astro-content-design-loop` or `/astro-content-design-loop` separately.
