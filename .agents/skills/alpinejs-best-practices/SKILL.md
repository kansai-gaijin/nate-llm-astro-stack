---
name: alpinejs-best-practices
description: Implement, review, or debug accessible Alpine.js interactions in Astro, including menus, accordions, dialogs, tabs, carousels, loading states, scroll behavior, and fluid transitions. Use when client-side state or interaction is needed without introducing a larger UI framework.
---

# Alpine.js Best Practices

Render useful semantic HTML first, then enhance it with the smallest local Alpine state.

## Structure state

- Scope `x-data` to the owning component. Extract a named Alpine data factory only when behavior is
  reused or state is complex.
- Use `x-show` for reversible visibility that should remain mounted and `x-if` only when DOM
  creation/destruction is required. Use stable keys for `x-for`.
- Prefer Alpine event modifiers (`.outside`, `.escape`, `.prevent`, `.stop`, `.debounce`) and
  `$dispatch` over custom global plumbing. Use `Alpine.store()` only for genuinely shared UI state.
- Keep content and business data on the server. Use Alpine for presentation state, not as an app-wide
  data layer.
- Use `$refs`, `$id`, `$nextTick`, and event modifiers instead of brittle global selectors.
- Use `x-cloak` for pre-initialization flashes. Preserve a usable non-JavaScript state.
- Synchronize ARIA state, focus, Escape behavior, outside clicks, scroll locking, and focus return.

## Make every transition fluid

- Do not toggle visible state abruptly. Coordinate enter and leave states with `x-transition`, CSS
  grid/clip techniques, or GSAP when sequencing or measured height makes it appropriate.
- Give transform origins and direction meaning. Avoid arbitrary bounce or excessive overshoot.
- Keep rapid hover/focus response short; use longer eased motion for panels, overlays, and page-level
  transitions.
- Prevent race conditions during fast repeated input. Confirm interrupted and reversed transitions
  remain continuous.
- Match the reference interaction model exactly. Do not convert scroll-driven behavior to clicks,
  hover behavior to toggles, or timed behavior to an IntersectionObserver approximation.
- Respect `prefers-reduced-motion`; reduce distance and duration rather than hiding required feedback.

## Keep it safe and maintainable

- Do not inject untrusted HTML with `x-html`.
- Remove global listeners, observers, timers, and animation contexts during teardown.
- Do not duplicate IDs across component instances.
- Prefer native elements (`button`, `details`, `dialog`) when they satisfy the behavior.

## Verify

Test keyboard-only use, touch, fast repeated clicks, outside click, Escape, focus restoration, initial
hydration, reduced motion, and console health. Refer to current [Alpine.js documentation](https://alpinejs.dev/start-here)
when directive behavior is uncertain.
