---
name: web-design-direction
description: Analyze reference websites and direct distinctive, polished, award-worthy websites and landing pages through fidelity, art direction, typography, composition, responsive behavior, media, interaction, and fluid motion. Use for design briefs, creative elevation after baseline fidelity, motion systems, GSAP decisions, Three.js decisions, and visual QA.
---

# Web Design Direction

Establish a faithful baseline before creatively elevating it. Preserve approved content and brand
recognition while improving hierarchy, rhythm, storytelling, interaction, and finish through user
feedback. "Award-worthy" means coherent art direction and craft, not maximum effects.

## Direct the visual system

- Identify the reference's composition rules, tension, whitespace, scale contrast, grid, cropping,
  typography, color, surfaces, and recurring motifs.
- Re-map supplied content into those rules without forcing it into unsuitable reference sections.
- Create a deliberate narrative across the fold, sections, and calls to action. Avoid generic card
  grids, gratuitous gradients, and template-like repetition.
- Art-direct every breakpoint. Mobile is a recomposed experience, not compressed desktop.
- Use original generated imagery, licensed video, and Iconify icons consistently.

## Enforce fluid motion

Anything that moves must move fluidly. Abrupt or ugly transitions are defects.

- Define a motion language: duration tiers, shared easing curves, distance, direction, stagger, and
  interruption behavior.
- Preserve continuity when states reverse or input repeats. Avoid teleporting elements, hard cuts,
  linear easing, jarring overshoot, and unrelated simultaneous motion.
- Animate with hierarchy: user feedback first, local content second, ambient decoration last.
- Review intermediate frames and motion at real speed. A correct final screenshot does not prove a
  good transition.
- Provide calm reduced-motion behavior with the same information and controls.

## Choose the right motion tool

- Use CSS/Alpine for simple hover, focus, reveal, accordion, and menu transitions.
- Add GSAP when the design needs timelines, interruption-safe choreography, complex scroll-linked
  sequences, SVG work, or coordinated state transitions. Scope animations and clean them up.
- Add Three.js only when 3D materially supports the story or identity. Lazy-load it, cap device pixel
  ratio, pause offscreen, provide static/mobile/reduced-motion fallbacks, and destroy resources.
- Reject an effect when it harms clarity, input response, accessibility, or performance.

## Audit for creative quality

Score concept coherence, typography, composition, responsive art direction, media quality, motion
craft, interaction clarity, accessibility, and performance. Keep a mismatch/quality ledger with
specific evidence and the next highest-impact improvements.
