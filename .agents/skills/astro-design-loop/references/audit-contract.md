# Clone audit contract

## Severity

- **P0**: missing route/content/media, broken navigation, structurally different mobile navigation,
  unusable layout, runtime failure, incomplete paired state coverage, or inaccessible core action.
- **P1**: conspicuous geometry, responsive, typography, crop, motion, loader, hover, or interaction
  mismatch. Invented reference-derived effects and abrupt or poorly interrupted motion are P1.
- **P2**: localized polish that does not alter structure, state, or task completion.

## Required evidence

Every finding must include route, viewport, state, expected reference, actual implementation,
paired evidence, measurement, severity, user impact, and a concrete fix direction.

Audit 1920, 1440, 768, 390, and 360 pixels. Treat 1920 as the primary desktop geometry target. At both mobile widths compare the header and navigation in
closed, opening/intermediate, open, submenu when present, closing, keyboard, and scroll-lock states.
Do not accept a generic drawer when the reference uses a different structure or transition.

For motion, inspect the sample times in `workflow/motion-manifest.json`, final state, reversal, rapid
interruption, and reduced motion. Confirm duration/easing within `workflow/acceptance.json` limits.

For media, verify every `reference-manifest.mediaRequirements` entry has an integrated replacement
with matching role, aspect ratio, crop, focal point, visual density, and provenance. An empty media
area or CSS abstraction does not pass when the reference uses photography or video.

Raw pixel similarity is supporting evidence only. Use paired regions, geometry measurements, and
state coverage. A score cannot override a failed hard gate.
