---
name: tailwindcss-4
description: Implement, review, or refactor interfaces using Tailwind CSS 4 with CSS-first configuration, design tokens, responsive composition, reusable variants, accessible states, and fluid motion. Use for Tailwind utilities, global styles, component styling, theme variables, breakpoints, container queries, and visual consistency in this Astro starter.
---

# Tailwind CSS 4

Use the installed Tailwind v4 Vite plugin and `@import "tailwindcss"`. Keep configuration CSS-first
in `src/styles/global.css`; do not add a v3-style config file unless a verified integration requires
one.

## Build from tokens

- Define reusable color, font, spacing, breakpoint, animation, duration, and easing tokens with
  `@theme` or CSS custom properties.
- Prefer a token or reusable component variant over repeated arbitrary values.
- Keep reference-specific one-off geometry explicit when abstraction would reduce fidelity.
- Use mobile-first responsive composition and container queries when behavior depends on component
  width rather than viewport width.
- Never construct partial utility names dynamically. Map states to complete static class strings.

## Keep components reusable

- Put repeated buttons, links, containers, headings, cards, media frames, and section shells in Astro
  components with typed variants.
- Keep the component API semantic (`intent`, `size`, `tone`) rather than exposing long class lists.
- Allow a constrained `class` escape hatch for layout placement, not for reimplementing the component.

## Make motion fluid

- Never use abrupt state changes for an element that visibly moves, appears, disappears, expands,
  changes color, or changes scale.
- Use explicit properties; avoid `transition-all`.
- Default small feedback to roughly 180-300 ms and larger entrances/panels to roughly 350-700 ms,
  then tune against the reference.
- Use the shared `ease-fluid`, `ease-emphasized`, and duration tokens. Animate `transform`, `opacity`,
  `filter`, or a deliberate grid/clip technique where possible.
- Pair hover with focus-visible. Provide reduced-motion behavior that preserves state clarity.
- Check intermediate frames, not only start/end screenshots.

## Verify

Inspect desktop and mobile rendering, keyboard focus, overflow, contrast, dynamic state classes, and
reduced motion. Refer to current [Tailwind CSS documentation](https://tailwindcss.com/docs) when a
v4 directive or utility is uncertain.
