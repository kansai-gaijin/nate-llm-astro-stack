---
name: astro-design-loop
description: Forensically reproduce complete reference websites in Astro before adapting approved Markdown content. Use for homepage or multi-page cloning that needs paired desktop/mobile reference capture, exact navigation and motion reconstruction, mandatory generated or royalty-free media, Astro, Alpine.js, TypeScript, Tailwind, microCMS, Google Fonts, and iterative Codex or Claude orchestration.
---

# Astro Design Loop

Treat invocation as permission to use the project subagents. Keep one write-capable agent active at
a time. The objective is reference reconstruction, not reference-inspired design.

Store every screenshot, video, trace, source dump, and temporary visual artifact under the ignored
`artifacts/` tree. Use `artifacts/reference`, `implementation`, `diff`, `forensics`, and `iterations`
as appropriate. Never place capture evidence in the project root.

Read the project skills `astro-best-practices`, `alpinejs-best-practices`, `tailwindcss-4`, and
`coding-best-practices`. Read `web-design-direction` only after the user explicitly authorizes
creative elevation.

## 1. Validate intake

1. Read `content/overview.md`, every listed page, `workflow/acceptance.json`, and all three reference
   workflow JSON files. Read `scaffold.config.json` when present.
2. Run `npm run content:validate`.
3. Implement only sitemap routes. `/` is always required.
4. Treat `referencePages` as the complete clone-source allowlist. Its primary top-page URL is
   mandatory. Inspect additional reference subpages only when the user explicitly lists them; never
   crawl or clone the rest of the reference site.
5. Determine the content source and Markdown fallback behavior.
6. Read [design-brief-contract.md](references/design-brief-contract.md) and
   [audit-contract.md](references/audit-contract.md).

## 2. Perform reference forensics before design or implementation

Delegate a read-only task to `reference-forensics` for each explicitly listed reference page. Do
not delegate to a creative designer or discover additional clone targets by crawling links.

Treat the reference's delivered HTML, CSS, and JavaScript as the authority for structure, computed
values, breakpoints, and behavior. Record source evidence before interpreting screenshots. Do not
copy proprietary bundles, copy, logos, or media unless permission and licensing explicitly allow
it; translate the observable implementation cleanly into the approved stack.

Convert observed CSS into Tailwind theme tokens, utilities, variants, and arbitrary values without
rounding, simplifying, or redesigning it. Use custom CSS only for exact keyframes, pseudo-elements,
complex selectors, or properties Tailwind cannot express. Recreate reference JavaScript behavior in
TypeScript/Alpine or the evidenced motion library with matching state and timing.

Use 1920x1080 as the primary desktop fidelity viewport. Also inspect 1440, 768, 390, and 360 pixels.
Mobile is an independent reference target, not a collapsed desktop interpretation. Capture and measure:

- desktop and mobile header geometry;
- closed and open mobile navigation, overlay, submenu, close behavior, scroll lock, and focus flow;
- loading start, intermediate, completion, and settled states when a loader exists;
- hover, focus, click, scroll, drag, carousel, accordion, and footer behavior;
- animation duration, easing, delay, stagger, transform origin, reversal, and interruption;
- every visually significant image and video, including aspect ratio, crop, focal point, and role.

Write the resulting evidence to `workflow/reference-manifest.json`, behavior to
`workflow/motion-manifest.json`, capture states to `workflow/reference-plan.json`, font decisions to
`workflow/font-map.json`, and the implementation brief to `workflow/design-brief.md`. Set all three
reference workflow files to `locked` only when the evidence is complete.

Every reference-derived action must have paired reference and implementation selectors.
`implementationOnly` is forbidden unless it carries a user-approved exception. Use readiness
selectors and media readiness, not arbitrary delays, to distinguish loader and settled states.

Run:

```text
npm run reference:validate
npm run artifacts:validate
npm run qa:capture:reference
```

If consent or anti-bot controls prevent capture, record the blocked state and use focused manual
browser evidence. Never bypass access controls.

## 3. Source media before the first clone build

Treat media as structure, not optional polish. If the reference uses photography or video, a CSS
gradient, abstract pattern, icon, or empty box is not an acceptable first-pass replacement.

For every entry in `reference-manifest.mediaRequirements`:

- source a close royalty-free image or video and verify its license at retrieval time;
- use image generation for original images when it better matches the required composition;
- use royalty-free or user-supplied video, with poster, mobile, data-saving, and reduced-motion
  fallbacks;
- match aspect ratio, crop, focal point, luminance, movement, and visual density;
- record `purpose: reference-replacement`, `requirementId`, local path, origin,
  source/license/author/date or generator/prompt, and `usedBy` files in `media/manifest.json`;
- integrate the asset in application/content code before considering the requirement complete.

If no licensed replacement exists, document searched sources and pause for approval of a static or
generated fallback. Do not silently omit the media. Run `npm run media:validate` before building.

## 4. Build the reference clone shell

The orchestrator owns one Astro dev server for the full three-iteration batch. Start it once before
delegating and always stop it at the feedback boundary or on abort:

```text
npm run loop:serve:start
npm run loop:serve:status
```

Subagents must use the existing URL. They must never run `astro dev`, `astro preview`, `npm run dev`,
`npm run preview`, or open their own server terminal. `npm run test:e2e` may use Playwright's managed
test server because Playwright owns and cleans up that process.

Start the iteration gate, then delegate to `clone-builder`:

```text
node scripts/loop-state.mjs begin
```

The clone-builder first reproduces the reference shell using neutral, length-matched placeholder
copy and replacement media. It must preserve section order, geometry, responsive transformations,
navigation, loading, and interaction behavior. Tailwind is the primary styling system, but exact
custom CSS variables, keyframes, and focused TypeScript modules are allowed. Add GSAP, Lenis, or
Three.js when source evidence or observed behavior justifies them; never choose the motion stack
before forensics.

Desktop width and alignment at 1920 pixels and mobile navigation at 360/390 pixels are P0 clone
requirements. Verify both before proceeding.
Do not invent alternate hovers, entrances, loaders, menus, or transitions. Anything that moves must
match the reference as closely as observable and remain fluid, reversible, interruption-safe, and
reduced-motion-safe.

## 5. Enforce the clone gate

Run the hard checks and capture the clone:

```text
npm run reference:validate
npm run artifacts:validate
npm run media:validate
npm run check
npm run build
npm run test:e2e
npm run qa:capture:implementation
npm run qa:diff
```

Run `visual-auditor` and `behavior-auditor` as independent read-only tasks. The clone gate fails for:

- incomplete paired state coverage;
- missing or structurally different mobile navigation;
- missing required replacement media;
- major geometry outside `workflow/acceptance.json` tolerances;
- missing motion samples or mismatched timing/easing/direction;
- any invented reference-derived effect;
- abrupt, linear, discontinuous, or poorly interrupted motion.

Do not call a baseline credible while any clone gate fails. Do not cap remediation at five findings
when the foundation, navigation, media, or motion subsystem is wrong; repair the failed subsystem.

## 6. Adapt approved content only after the clone gate passes

Delegate sequentially to `astro-builder` in content-adapter mode. Replace neutral copy with approved
Markdown while preserving clone components, proportions, media roles, and motion hooks. Never copy
factual reference content into the final site.

When supplied content does not fit, first select another pattern observed on the same reference.
Record unavoidable structural deviations and request user direction when they materially change the
result. Do not silently create a new design language.

For dynamic content, read [microcms.md](references/microcms.md), create manifests and importable
schemas, run `npm run microcms:check`, and then use `fixture-copywriter` sequentially when fixtures
are required. Preserve Markdown fallback when configured.

Re-run the complete gate after content adaptation:

```text
npm run content:validate
npm run reference:validate
npm run artifacts:validate
npm run dynamic:validate
npm run media:validate
npm run check
npm run build
npm run test:e2e
npm run qa:capture:implementation
npm run qa:diff
```

## 7. Iterate and enforce feedback boundaries

Synthesize the independent audits without averaging away serious failures. Fix reference fidelity
in this order: broken behavior, mobile navigation, missing media, major geometry, responsive
structure, motion, typography, then cosmetic detail.

Complete the iteration:

```text
node scripts/loop-state.mjs complete
```

After exactly three completed build-audit iterations, stop the managed server:

```text
npm run loop:serve:stop
```

Then show routes/states, paired desktop and mobile evidence, media provenance, remaining P0/P1/P2
findings, and gate results. Record the user response with:

```text
node scripts/loop-state.mjs feedback continue
node scripts/loop-state.mjs feedback approved
```

Continue in batches of three until explicit approval. Creative elevation remains disabled until
the clone gate passes and the user explicitly requests it.

## 8. Final handoff and deployment

Verify every sitemap route, content file, paired interaction state, required media replacement,
mobile navigation state, microCMS endpoint, and build gate. Report Google Font substitutions and
approved structural deviations separately from unresolved fidelity gaps.

For Cloudflare Pages, follow `deployment/cloudflare-pages.md`. Do not create external repositories,
projects, releases, or webhooks without explicit authorization.
