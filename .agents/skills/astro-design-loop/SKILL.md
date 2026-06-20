---
name: astro-design-loop
description: Build or reproduce complete Astro websites from content/overview.md, Markdown page copy, and a visual reference URL. Use for reference-driven homepage or multi-page generation that needs Astro, Alpine.js, TypeScript, Tailwind, microCMS, Google Fonts, media sourcing, browser QA, visual comparison, and iterative Codex or Claude subagent orchestration.
---

# Astro Design Loop

Treat invocation of this skill as an explicit request to use the project subagents. Keep the main
thread focused on requirements, decisions, evidence, and user checkpoints. Never run more than one
write-capable agent at a time.

Read and apply the project skills `astro-best-practices`, `alpinejs-best-practices`, `tailwindcss-4`,
`web-design-direction`, and `coding-best-practices`. If nested skill activation is unavailable, read
their canonical `SKILL.md` files under `.agents/skills/` directly.

## 1. Validate intake

1. Read `content/overview.md`, every page file it lists, `workflow/acceptance.json`, and
   `workflow/reference-plan.json`. Read `scaffold.config.json` when present.
2. Run `npm run content:validate`. Stop for missing top-page copy, invalid sitemap entries, or an
   absent reference URL.
3. Confirm that only sitemap routes are required. Implement all supplied routes; do not infer inner
   pages from the reference when the sitemap omits them.
4. Read [design-brief-contract.md](references/design-brief-contract.md) before delegating reference
   analysis.
5. Determine `CONTENT_SOURCE` and whether Markdown fallback is required. The site must build from
   Markdown whenever microCMS is disabled or unavailable and fallback is enabled.

## 2. Establish reference truth

Delegate to `reference-designer` as a read-only task. Require inspection of desktop, tablet, and
mobile layouts plus loading, hover, focus, scroll, menu, and animation states. Require the designer
to map supplied copy to the reference structure without inventing facts.

Save the returned decisions to `workflow/design-brief.md`; save the font decision to
`workflow/font-map.json`; update `workflow/reference-plan.json` with every page/state that must be
captured. Capture reference evidence before implementation:

```text
npm run qa:capture:reference
```

If a consent screen or anti-bot control prevents deterministic capture, record it and use focused
manual browser captures. Never bypass access controls.

## 3. Plan content, media, and microCMS

- Preserve all approved Markdown copy. Permit structural reordering and component grouping only.
- Require reusable typed components for repeated buttons, links, containers, cards, media frames,
  headings, and section patterns.
- Generate original images with an available image-generation capability. If none is available,
  write a precise asset brief and ask the user to generate or supply the assets.
- When the reference or content calls for video, search for a close royalty-free replacement. Verify
  its license at retrieval time and record source, license, author, and date in
  `media/manifest.json`. If no suitable video exists, record the searched sources and propose a
  static/generated fallback for user approval.
- Use Iconify icons. Do not download icons or media from the reference site.
- For dynamic content, read [microcms.md](references/microcms.md), generate
  `microcms/manifest.json` and importable schema files, then run `npm run microcms:check`.
- After schemas are stable, delegate sequentially to `fixture-copywriter`. Require 20 plausible
  Markdown fixtures for every list endpoint, one fixture for each object endpoint, and original
  generated imagery for applicable image fields. Validate with `npm run dynamic:validate` and
  `npm run media:validate`.
- If automatic endpoint creation is not supported or credentials/permissions are insufficient,
  provide the generated schema files and exact dashboard import steps. Pause until the user confirms
  manual setup, then re-run the check.

## 4. Run an implementation iteration

Start the gate:

```text
node scripts/loop-state.mjs begin
```

Delegate one bounded implementation task to `astro-builder`. On the first iteration, implement a
coherent end-to-end page foundation rather than isolated decorative fragments. On later iterations,
give the builder only the orchestrator-approved highest-impact discrepancies.

Establish reference fidelity before creative divergence. After the baseline is credible, use user
feedback and `web-design-direction` to elevate composition, storytelling, media, and interaction
toward award-worthy quality. Add GSAP or Three.js only when the approved direction justifies the
cost. Anything that moves must be fluid; abrupt transitions fail the iteration.

After the builder returns, run the hard checks:

```text
npm run content:validate
npm run dynamic:validate
npm run media:validate
npm run check
npm run build
npm run test:e2e
```

Fix build or functional blockers through `astro-builder` before auditing visual polish.

## 5. Audit independently

Read [audit-contract.md](references/audit-contract.md). Run `visual-auditor` and
`behavior-auditor` in parallel only after the working tree is stable. Both are read-only.

Capture the local implementation and generate the diagnostic diff:

```text
npm run qa:capture:implementation
npm run qa:diff
```

Synthesize both audit reports. Do not average away serious failures. Select at most five fixes for
the next iteration, ordered by user-visible impact: broken behavior, major geometry, responsive
structure, motion, then cosmetic details.

Complete the iteration gate:

```text
node scripts/loop-state.mjs complete
```

Store the brief, audit reports, screenshots, and diff report in the numbered iteration directory
created by the gate. Do not replace reference evidence with implementation screenshots.

## 6. Enforce the feedback boundary

After exactly three completed iterations, stop and show the user:

- implemented routes and states;
- before/current screenshots or concise evidence links;
- remaining P0/P1/P2 discrepancies;
- hard-gate results;
- the weighted design score from `workflow/acceptance.json`.

Ask whether to approve or continue with feedback. Do not begin iteration four before an answer.
Record the response with one of:

```text
node scripts/loop-state.mjs feedback continue
node scripts/loop-state.mjs feedback approved
```

Continue in three-iteration batches until the user explicitly approves. A high pixel score, a
plateau, or exhausted easy fixes is not approval.

## 7. Prepare deployment

When `scaffold.config.json` selects `cloudflare-pages`, keep the site statically generated unless a
real runtime requirement demands SSR. Follow `deployment/cloudflare-pages.md`: verify GitHub CI,
Cloudflare build command `npm run build`, output directory `dist`, environment secrets, preview
deployments, and the production branch. When microCMS is active, require a protected Pages deploy
hook and a microCMS webhook for content events that affect the build.

Do not create external repositories, Cloudflare projects, npm releases, or webhooks without explicit
user authorization for those mutations.

## 8. Final audit

Before handoff, verify every sitemap route, content file, interaction state, media provenance entry,
microCMS endpoint, build/test gate, and responsive viewport. Report any approved Google Font
substitution separately from genuine fidelity gaps.
