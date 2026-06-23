---
name: gsap-fluid-motion
description: Implement or audit complex GSAP animation in Astro and Alpine when reference evidence or an approved design requires timelines, ScrollTrigger, SVG animation, coordinated state transitions, or interruption-safe choreography beyond CSS. Covers responsive setup, performance, reduced motion, sampling, and cleanup.
---

# GSAP Fluid Motion

Use GSAP only when the locked motion manifest or approved design proves CSS/Alpine is insufficient.
Do not add it for a simple hover or fade.

- Dynamically import `gsap` and required plugins only where used; register each plugin once.
- Scope selectors and cleanup with `gsap.context()`. Use `gsap.matchMedia()` for desktop, mobile,
  and `prefers-reduced-motion`, then `revert()` on teardown.
- Build named timelines with shared defaults. Match observed duration, easing, delay, stagger,
  transform origin, and scroll start/end exactly during cloning.
- For interactive transitions, use reversible timelines or overwrite-safe tweens
  (`overwrite: 'auto'`) so rapid repeated input never jumps. Test interruption at intermediate
  sample times.
- For ScrollTrigger, wait for fonts/media/layout, call `ScrollTrigger.refresh()`, avoid accidental
  pin spacing, and kill triggers/observers when the component leaves.
- Animate transform and opacity where possible. Avoid layout reads inside frame callbacks and use
  quick setters for high-frequency pointer motion.
- Reduced motion must preserve information and final state with distance/parallax removed.

Audit at real speed plus at least three sampled frames. Check reversal, repeated input, resize,
mobile touch, background-tab resume, reduced motion, console health, and teardown.
