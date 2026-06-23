---
name: astro-update-loop
description: Implement a bounded user-requested change in an approved and shipping-valid Astro site while preserving content coverage, brand system, responsive fidelity, accessibility, performance, and fluid motion. Use as the third loop after content-and-design approval for maintenance, additions, fixes, and refinements.
---

# Astro Update Loop

This is loop 3. It is unlocked only after loop 2 is user-approved and `npm run shipping:validate`
passes. Start a request with `npm run update:begin -- <short-request-id>`.

Read [the change contract](references/change-contract.md). Translate the user's request into a
small acceptance checklist before editing. Inspect the affected implementation, existing design
tokens, components, tests, and prior adaptation evidence. Do not reopen clone scope or copy removed
reference material.

Use `astro-builder` for application writes. Spawn read-only auditors when the request affects
layout, motion, navigation, multiple routes, or responsive behavior. Give Opus 4.8 literal scope:
name every affected route/state/breakpoint and explicitly name what must remain unchanged.

Prefer existing primitives and tokens. Use Astro components and static HTML first, Alpine for local
interaction, GSAP only for evidenced complex timelines/scroll behavior, and Three.js only for an
approved 3D requirement. Every new motion must be eased, reversible/interruption-safe where
interactive, and reduced-motion compatible.

Run one to three build-audit passes as needed; do not force three passes for a trivial change. Save
evidence under `artifacts/update/requests/<request-id>/`. Before completion run:

```text
npm run content:validate
npm run content:coverage:validate
npm run artifacts:validate
npm run media:validate
npm run dynamic:validate
npm run shipping:validate
npm run check
npm run build
npm run test:e2e
```

Write `artifacts/update/requests/<request-id>/audit.json` with `hardGatesPassed`, empty `p0`/`p1`,
changed files, and verification results. Finish with `npm run update:complete`. If the request
materially changes brand direction, sitemap, content authority, or approved clone-derived
architecture, stop and ask for explicit scope approval rather than smuggling a redesign into
maintenance.
