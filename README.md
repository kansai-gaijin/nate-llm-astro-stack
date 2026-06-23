# nate-llm-astro-stack

An interactive, publishable Astro 7 starter that turns approved Markdown content, a brand brief,
and selected reference URLs into a complete website through three isolated loops: literal clone,
content-and-design adaptation, and post-approval updates. Codex and Claude Code are configured, with
prompts tuned explicitly for Claude Opus 4.8.

Use Node 22.22 (`nvm use` reads the included `.nvmrc`). Astro 7.0/Vite 8 currently completes and
then crashes on Windows Node 24 during process teardown, so this starter intentionally pins the
stable Node 22 line until that upstream issue is resolved.

## Create a project

Run it straight from GitHub (no npm publish required):

```text
npx github:kansai-gaijin/nate-llm-astro-stack my-site
```

Or, after this package is published to npm:

```text
npx nate-llm-astro-stack@latest my-site
```

The CLI asks for:

- Cloudflare Pages with GitHub integration or generic static hosting;
- Markdown, microCMS with Markdown fallback, or required microCMS;
- reference-first automatic motion-tool selection, CSS/Alpine, GSAP, or GSAP plus Three.js;
- dependency installation and fresh Git initialization.

For local package development, run `npm run create:test` or use
`node bin/nate-llm-astro-stack.mjs ../my-site`.

## Provide content

1. Replace `content/overview.md`. Its frontmatter defines the primary top-page reference URL,
   optional explicitly selected reference subpages, locale, required sitemap, and dynamic-content
   requirements. Unlisted reference pages are not crawled or cloned.
2. Add one Markdown file under `content/pages/` for every sitemap entry. Include all approved page
   text; the loop may reorganize it but cannot invent business facts.
3. Copy `.env.example` to `.env` and fill only the integrations you use.

The top page (`/`) is mandatory. Inner pages are generated only when listed in the sitemap.
Dynamic content uses one typed API and can switch between microCMS and
`content/dynamic/<endpoint>/*.md` without page/component changes.

## Run the three loops

First, run the literal clone loop. It does not use your supplied page content.

Codex:

```text
Use $astro-reference-clone to build and audit the literal reference clone.
```

Claude Code:

```text
/astro-reference-clone
```

After you explicitly approve the clone, start a new invocation.

Codex:

```text
Use $astro-content-design-loop to adapt every approved Markdown block and the brand into the approved clone.
```

Claude Code:

```text
/astro-content-design-loop
```

The adaptation command is blocked until clone approval. Both design loops pause after every three
iterations and use separate state/audit artifacts. After the adapted site is approved and clone
material is removed, use `$astro-update-loop` or `/astro-update-loop` for later requested changes.

Agents include parallel read-only reference forensics, a shared-foundation clone builder, isolated
section builders, a post-clone Astro content adapter, visual/behavior auditors, and a fixture
copywriter. Section builders receive complete computed-style specs before writing anything.

The clone loop first locks paired desktop/mobile evidence, downloads the reference site's visible
images and video into an isolated temporary clone directory, and reconstructs the shell and motion
without reading supplied page copy. The separate adaptation loop then replaces those temporary
assets with generated or royalty-free media and adapts the approved Markdown. Mobile
navigation is independently captured and audited at 360px and 390px; desktop geometry is measured
primarily at 1920px and secondarily at 1440px. Delivered reference HTML/CSS/JS is authoritative,
with exact observed CSS translated into Tailwind rather than reinterpreted.

The orchestrator owns one managed Astro dev server for each three-iteration batch:

```text
npm run loop:serve:start
npm run loop:serve:status
npm run loop:serve:logs
npm run loop:serve:stop
```

These commands use Astro 7's native lock-protected background server and JSON logs. Subagents use
that server and do not open their own dev/preview terminals.
All screenshots, videos, traces, source dumps, and comparison evidence go under the Git-ignored
`artifacts/` directory; `npm run artifacts:validate` rejects capture files in the project root.

## Quality model

- Reference fidelity is a hard gate; creative elevation requires explicit user approval afterward.
- Anything that moves must be fluid. Abrupt transitions, ugly hover states, discontinuous motion,
  and poor interruption/reversal behavior fail the audit.
- GSAP and Three.js are optional and must justify their performance/accessibility cost.
- Repeated buttons, containers, sections, cards, media frames, and patterns become typed reusable
  components.
- Dedicated Astro, Alpine.js, Tailwind CSS 4, web-design, and coding-practice skills guide the work.

## Included foundation

- Astro 7 with Vite 8/Rolldown, Rust compiler/Markdown pipeline, native agent background server,
  health endpoint, and structured logs
- reusable `Head`, `BaseLayout`, `Button`, `Container`, and `Section` components
- shared motion duration/easing tokens and reduced-motion behavior
- Google Fonts, conditional Google Tag Manager, Iconify, SEO/social metadata
- microCMS adapter with automatic Markdown fallback
- microCMS endpoint/schema inspection and manual-import fallback
- Playwright responsive, console, accessibility, interaction, capture, and visual-diff tooling
- generated-image and royalty-free-video provenance validation
- GitHub CI, Cloudflare Pages Git deployment instructions, and microCMS deploy-hook instructions

## Commands

```text
npm install
npx playwright install chromium
npm run dev
npm test
npm run microcms:check
npm run astro7:validate
npm run content:coverage:validate
npm run qa:capture:reference
npm run qa:extract:reference
npm run clone:assets:download
npm run qa:capture:implementation
npm run qa:diff
npm run create:test
npm pack --dry-run
```

See `deployment/cloudflare-pages.md` when the generated project targets Cloudflare Pages.

## Continuous integration

`.github/workflows/ci.yml` runs the full verification suite on Linux. Its install step is
self-healing: it uses strict `npm ci`, and only if that fails — for example when `package-lock.json`
was regenerated on Windows, which drops Tailwind's bundled `@tailwindcss/oxide-wasm32-wasi` (emnapi)
nodes — it falls back to a Linux `npm install` and commits the corrected lockfile back to the branch.
This means you can change dependencies on any OS and let CI produce the canonical cross-platform
lockfile; no local Docker or WSL is required. The workflow needs `contents: write`; on protected
branches the fix is applied for the test run but not pushed. Generated projects inherit this CI.

## microCMS limitation

The current documented microCMS Management API can list APIs and retrieve schemas, but does not
expose API/schema creation. `npm run microcms:check` validates existing endpoints. When an endpoint
is missing or Management API access is unavailable, it prints exact dashboard steps and points to
importable files in `microcms/schemas/`. The loop pauses until manual setup is confirmed. Sites that
do not use microCMS continue entirely from Markdown.

## Publishing this template

Push this source package to a GitHub repository, set an `NPM_TOKEN` repository secret, and publish a
GitHub Release. `.github/workflows/publish-package.yml` validates the tarball and publishes it with
npm provenance. Confirm the npm package name `nate-llm-astro-stack` is available before the first
release.
