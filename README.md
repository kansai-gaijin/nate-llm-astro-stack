# Create Astro Design Loop

An interactive, publishable Astro starter that turns approved Markdown content and a reference URL
into a complete website through a designer → builder → independent-auditor loop. It establishes
reference fidelity first, then iterates toward a distinctive, award-worthy result. Codex and Claude
Code are both configured.

## Create a project

After this package is published:

```text
npx create-astro-design-loop@latest my-site
```

The CLI asks for:

- Cloudflare Pages with GitHub integration or generic static hosting;
- Markdown, microCMS with Markdown fallback, or required microCMS;
- CSS/Alpine motion, GSAP, or GSAP plus Three.js;
- dependency installation and fresh Git initialization.

For local package development, run `npm run create:test` or use
`node bin/create-astro-design-loop.mjs ../my-site`.

## Provide content

1. Replace `content/overview.md`. Its frontmatter defines the reference URL, locale, required
   sitemap, and dynamic-content requirements.
2. Add one Markdown file under `content/pages/` for every sitemap entry. Include all approved page
   text; the loop may reorganize it but cannot invent business facts.
3. Copy `.env.example` to `.env` and fill only the integrations you use.

The top page (`/`) is mandatory. Inner pages are generated only when listed in the sitemap.
Dynamic content uses one typed API and can switch between microCMS and
`content/dynamic/<endpoint>/*.md` without page/component changes.

## Run the loop

Codex:

```text
Use $astro-design-loop and the project subagents to build the site from content/overview.md.
```

Claude Code:

```text
/astro-design-loop
```

Both use the canonical workflow in `.agents/skills/astro-design-loop/`. Native agent adapters live
under `.codex/agents/` and `.claude/agents/`. The loop pauses after every three iterations and only
ends when the user explicitly approves the result.

Agents include reference designer, Astro builder, visual auditor, behavior/motion auditor, and a
fixture copywriter that creates at least 20 plausible items per dynamic list endpoint with generated
test imagery where applicable.

## Quality model

- Reference fidelity is the starting point; art direction and creative elevation follow feedback.
- Anything that moves must be fluid. Abrupt transitions, ugly hover states, discontinuous motion,
  and poor interruption/reversal behavior fail the audit.
- GSAP and Three.js are optional and must justify their performance/accessibility cost.
- Repeated buttons, containers, sections, cards, media frames, and patterns become typed reusable
  components.
- Dedicated Astro, Alpine.js, Tailwind CSS 4, web-design, and coding-practice skills guide the work.

## Included foundation

- Astro 6, Alpine.js, strict TypeScript, and Tailwind CSS 4
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
npm run qa:capture:reference
npm run qa:capture:implementation
npm run qa:diff
npm run create:test
npm pack --dry-run
```

See `deployment/cloudflare-pages.md` when the generated project targets Cloudflare Pages.

## microCMS limitation

The current documented microCMS Management API can list APIs and retrieve schemas, but does not
expose API/schema creation. `npm run microcms:check` validates existing endpoints. When an endpoint
is missing or Management API access is unavailable, it prints exact dashboard steps and points to
importable files in `microcms/schemas/`. The loop pauses until manual setup is confirmed. Sites that
do not use microCMS continue entirely from Markdown.

## Publishing this template

Push this source package to a GitHub repository, set an `NPM_TOKEN` repository secret, and publish a
GitHub Release. `.github/workflows/publish-package.yml` validates the tarball and publishes it with
npm provenance. Set the final npm package name and repository metadata before the first release if
`create-astro-design-loop` is unavailable.
