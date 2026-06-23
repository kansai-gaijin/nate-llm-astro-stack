---
name: astro-content-adaptation
description: Adapt supplied Markdown, brand assets, royalty-free or generated media, and microCMS into an explicitly user-approved Astro reference clone. Use only as a separate second phase after the literal clone loop is approved; preserves the immutable clone while building final sitemap routes and auditing structural drift in three-iteration batches.
---

# Astro Content Adaptation

This phase cannot start until `workflow/phase-state.json` records an explicitly user-approved clone.
Run `npm run adaptation:begin`; it must fail when the clone is unapproved.

The approved clone under `src/**/clone` and `/__clone/*` is immutable evidence. Do not edit it.
Read supplied Markdown, wireframes, brand documents, logos, and microCMS requirements only now.
When dynamic endpoints are declared, follow [the microCMS provisioning contract](references/microcms.md).

Delegate `astro-builder` as the sole writer. Copy or parameterize clone patterns into final sitemap
routes, then replace reference copy and temporary assets with approved content, user-supplied assets,
generated images, and royalty-free video. Preserve section geometry, responsive behavior,
navigation mechanics, hover effects, loaders, and motion unless content makes a literal mapping
impossible. Record material deviations and ask before redesigning.

After final adaptation approval, archive clone source/screenshots under `artifacts/clone/approved`,
then remove `src/pages/__clone` and `public/clone-temp`. Run `npm run shipping:validate` before any
production build; reference assets and clone-only routes must never ship.

Do not compare final text pixels directly with reference text. Compare shell geometry, section
patterns, media roles/aspect ratios, navigation states, and motion against the immutable clone.

For every adaptation iteration run:

```text
npm run phase:validate
npm run content:validate
npm run artifacts:validate
npm run media:validate
npm run dynamic:validate
npm run check
npm run build
npm run test:e2e
```

Capture final routes into `artifacts/adaptation/implementation` and compare mapped regions against
the approved clone. Run read-only visual and behavior auditors. Write
`artifacts/adaptation/iterations/NNN/audit.json` with phase, iteration, hard gates, P0, and P1.

Finish through `npm run adaptation:complete`. Pause after each three-iteration batch. Continue until
the user explicitly approves adaptation. Creative elevation remains a later, explicit request; it
is not part of adaptation by default.
