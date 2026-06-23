---
name: astro-best-practices
description: Implement, review, or refactor Astro websites with server-first rendering, strict TypeScript, reusable layouts and components, minimal client JavaScript, optimized assets, content-source boundaries, SEO, accessibility, and static Cloudflare deployment. Use for Astro pages, components, routing, data fetching, content, scripts, and build architecture.
---

# Astro Best Practices

## Use Astro 7 deliberately

- Require Node 22.12+, Astro 7, Vite 8/Rolldown, and the Astro 7-compatible Alpine integration.
- Astro 7's Rust compiler no longer repairs invalid HTML. Close every element/attribute correctly,
  keep nesting valid, and add explicit `{' '}` when adjacent inline elements require whitespace.
- Let Astro 7's Rust Satteri pipeline handle Markdown/MDX by default. Do not add unified/remark/
  rehype compatibility unless a required plugin proves it is necessary.
- Use `astro dev --background`, `astro dev status`, `astro dev logs`, and `astro dev stop` for agent
  workflows. One orchestrator owns the native lock-protected server; workers never start servers.
- Use `/_astro/status` for readiness and `--json` for machine-readable agent logs.
- Do not add `src/fetch.ts`, route caching, or a CDN cache provider to a static marketing site just
  to claim feature usage. Advanced Routing and `Astro.cache` are for actual request-time pipelines.

## Keep Astro server-first

- Render pages and content to HTML at build time unless a requirement genuinely needs runtime
  rendering.
- Use `.astro` components, layouts, slots, and typed props. Add Alpine only around interactive
  islands; do not add a framework runtime for static markup.
- Keep secrets and microCMS access in server/build modules. Never expose a non-`PUBLIC_` variable.
- Keep each route in the sitemap explicit and ensure the top page always exists.

## Build reusable boundaries

- Reuse layouts, head metadata, buttons, containers, media frames, headings, and repeated sections.
- Keep data access behind `src/lib/content/`; pages and components should not know whether data came
  from microCMS or Markdown.
- Return consistent typed models from every content source and fail with actionable messages.
- Use local Markdown fixtures for deterministic builds, previews, and CMS-unavailable fallback.

## Ship fast pages

- Prefer static output for Cloudflare Pages. Fetch build-time CMS data during `astro build` and use a
  deploy hook when content changes.
- Optimize images and reserve media dimensions. Lazy-load below-the-fold images, video, GSAP, and
  Three.js.
- Use `Image`/`Picture` from `astro:assets` for statically imported final imagery. For runtime CMS
  URLs or public assets, keep explicit intrinsic width/height, sizes, loading, and decoding.
- Keep browser scripts scoped and removable. Clean up observers, WebGL contexts, GSAP contexts, and
  event listeners.
- Use canonical URLs, complete metadata, semantic landmarks, and accessible navigation.

## Verify

Run `astro check`, the production build, route tests, interaction tests, and rendered browser QA.
Test the Markdown mode without network credentials. Run `npm run astro7:validate`. Refer to current
[Astro documentation](https://docs.astro.build/) when an Astro 7 API or deployment behavior is uncertain.
