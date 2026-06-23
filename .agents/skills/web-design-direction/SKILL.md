---
name: web-design-direction
description: Analyze reference websites and direct distinctive, polished, award-worthy websites and landing pages through fidelity, art direction, typography, composition, responsive behavior, media, interaction, and fluid motion. Use for design briefs, creative elevation after baseline fidelity, motion systems, GSAP decisions, Three.js decisions, and visual QA.
---

# Web Design Direction

Establish a faithful baseline before creatively elevating it. Preserve approved content and brand
recognition while improving hierarchy, rhythm, storytelling, interaction, and finish through user
feedback. "Award-worthy" means coherent art direction and craft, not maximum effects.

Claude Opus 4.8 has a persistent cream/serif/terracotta default. Never let that default replace
reference or brand evidence. Give concrete colors, typography, radii, spacing, composition, media
treatment, and motion direction. In literal clone mode, creative defaults are prohibited entirely.

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
  sequences, SVG work, or coordinated state transitions. Dynamically import it, register plugins
  once, scope with `gsap.context()`/`gsap.matchMedia()`, use overwrite-safe reversible timelines,
  refresh ScrollTrigger after media/fonts/layout settle, and revert all contexts on teardown.
- Add Three.js only when 3D materially supports the story or identity. Lazy-load it, cap device pixel
  ratio, use glTF/GLB with Draco/KTX2 when size justifies it, use instancing/LOD for repeated or
  distant objects, pause offscreen, provide static/mobile/reduced-motion fallbacks, and dispose
  geometry, materials, textures, controls, renderers, observers, and WebGL contexts.
- Reject an effect when it harms clarity, input response, accessibility, or performance.

## Direct Japanese typography

These sites are primarily Japanese. Japanese text quality is an art-direction concern, not an
afterthought, because browsers break spaceless Japanese between arbitrary characters and split kanji
compounds at ugly points.

- Design for phrase-level (文節) line breaks. Headings, hero copy, navigation, buttons, and pull
  quotes must break at meaningful boundaries, never mid-compound or with a single trailing character.
- Treat the global baseline (`line-break: strict`, `word-break: auto-phrase`, `text-wrap: pretty`) as
  the floor. For display text that must read perfectly in every browser, specify BudouX `<wbr>` with
  `break-keep` so breaks land only where intended.
- Choose Japanese-capable fonts (default Noto Sans JP) and tune line-height and letter-spacing for
  CJK density; Latin-tuned spacing makes Japanese cramped or loose.
- Mix Japanese and Latin deliberately. Set Latin numerals, units, and loanwords without forcing
  awkward wraps, and keep alignment calm — avoid justified Japanese unless kinsoku is fully handled.

## Audit for creative quality

Score concept coherence, typography, composition, responsive art direction, media quality, motion
craft, interaction clarity, accessibility, and performance. Keep a mismatch/quality ledger with
specific evidence and the next highest-impact improvements.
