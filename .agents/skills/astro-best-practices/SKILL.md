---
name: astro-best-practices
description: Implement, review, or refactor Astro websites with server-first rendering, strict TypeScript, reusable layouts and components, minimal client JavaScript, optimized assets, content-source boundaries, SEO, accessibility, and static Cloudflare deployment. Use for Astro pages, components, routing, data fetching, content, scripts, and build architecture.
---

# Astro Best Practices

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
- Keep browser scripts scoped and removable. Clean up observers, WebGL contexts, GSAP contexts, and
  event listeners.
- Use canonical URLs, complete metadata, semantic landmarks, and accessible navigation.

## Verify

Run `astro check`, the production build, route tests, interaction tests, and rendered browser QA.
Test the Markdown mode without network credentials. Refer to current [Astro documentation](https://docs.astro.build/)
when an Astro 6 API or deployment behavior is uncertain.
