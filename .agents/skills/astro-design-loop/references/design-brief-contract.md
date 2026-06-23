# Reference forensics contract

Return evidence-backed artifacts with these sections:

1. **Inspected evidence**: only the primary top page and explicitly listed reference subpage URLs,
   with date, browser, delivered HTML structure, CSS files/computed values, JavaScript
   files/libraries, viewports, blocked states, and observation versus inference.
2. **Page and component inventory**: ordered sections, repeated patterns, DOM landmarks, geometry,
   spacing, grid, surfaces, and breakpoints.
3. **Navigation inventory**: desktop and mobile DOM, dimensions, open/closed states, overlay,
   submenu, scroll lock, focus order, keyboard behavior, and transition details.
4. **Typography**: observed fonts and the closest Japanese-capable Google Font substitutes, with
   size, weight, line height, tracking, width, and wrapping behavior.
5. **Responsive evidence**: explicit differences at 1920, 1440, 768, 390, and 360 pixels. Treat 1920
   as the primary desktop width and mobile as
   its own composition. Include mobile header and navigation screenshots.
6. **Motion manifest**: one record per loader, entrance, hover, focus, click, menu, scroll, drag,
   carousel, or accordion interaction. Include selectors, trigger, affected properties, duration,
   driver (CSS transition, Web Animations, GSAP, RAF, or native scroll), easing, delay, stagger,
   transform origin, at least three sampled computed-style checkpoints, reversal, interruption, and
   reduced motion.
7. **Media requirements**: every significant image/video with route, role, dimensions/aspect ratio,
   crop, focal point, luminance/motion characteristics, replacement strategy, and fallback.
8. **Content mapping**: neutral clone slots first, then approved Markdown mapping. Identify text that
   cannot fit without structural change.
9. **Acceptance risks**: inaccessible evidence, content/reference conflicts, font limits, and the
   highest-risk desktop and mobile fidelity areas.

Do not propose creative elevation. Do not replace observed photography/video with CSS abstractions.
Use delivered HTML/CSS/JS as the source of truth. Specify exact CSS-to-Tailwind mappings without
rounding or simplification. Use concrete values and paired selectors wherever evidence permits.
