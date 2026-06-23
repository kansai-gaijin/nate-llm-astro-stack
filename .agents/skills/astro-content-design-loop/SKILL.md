---
name: astro-content-design-loop
description: Adapt every approved Markdown text block and supplied brand requirement into an explicitly approved Astro reference clone, replace temporary copyrighted reference material, create all sitemap routes, and audit content coverage, brand fit, responsive behavior, accessibility, media provenance, and fluid motion. Use only as a separate second loop after literal clone approval.
---

# Astro Content and Design Loop

This is loop 2. It cannot run in the clone invocation. Run `npm run adaptation:begin`; stop if
`workflow/phase-state.json` does not show an explicitly approved clone.

Read all approved `content/` inputs now. Treat every meaningful text block in
`content/pages/*.md` as required output, not optional inspiration. Populate `workflow/content-map.json`
and run `npm run content:coverage:validate`; rendered browser tests must prove that every mapped
block appears on its declared route.

Read [the adaptation boundary](references/adaptation-boundary.md) and, when dynamic endpoints are
declared, [the microCMS contract](references/microcms.md).

## Design adaptation

Use the approved clone as immutable structural evidence. Replace reference text, logos, imagery,
video, fonts, and other protected brand expression. Use supplied brand assets plus generated or
royalty-free media with provenance. Preserve the reference's useful composition, hierarchy,
responsive transformations, interaction model, hover behavior, loading rhythm, and motion grammar,
then adjust section structure where the user's content requires it.

Do not fall back to Claude's default cream/serif/terracotta house style or any other generic AI
palette. Derive concrete colors, radii, typography, spacing, image treatment, and motion from the
approved clone plus the supplied brand. Record the result in `workflow/design-adaptation.json`.

Delegate `astro-builder` as the sole integration writer. `fixture-copywriter` may create only
declared dynamic fixtures and approved generated imagery. Read-only visual and behavior auditors
may run in parallel. Give every agent explicit file boundaries and success criteria; Opus 4.8
follows literal scope, so state when a rule applies to every route, section, breakpoint, and state.

## Iterations and gate

For every iteration run:

```text
npm run phase:validate
npm run content:validate
npm run content:coverage:validate
npm run artifacts:validate
npm run media:validate
npm run dynamic:validate
npm run check
npm run build
npm run test:e2e
```

Capture under `artifacts/adaptation/`. Compare final routes to the approved clone by geometry,
section roles, responsive behavior, and interaction/motion—not by reference words or protected
assets. Write the objective audit receipt and finish with `npm run adaptation:complete`.
The receipt must report `contentCoverage: 1`, `routesCoverage: 1`,
`referenceMaterialRemaining: 0`, `brandSystemRecorded: true`, and
`phaseBoundaryPassed: true`; a claimed pass is rejected when any value differs.

Pause after exactly three iterations. Continue in three-iteration batches until the user approves.
After approval, archive evidence, remove `/__clone/*` and `public/clone-temp`, then run
`npm run shipping:validate`. End this invocation; maintenance changes belong to loop 3.
