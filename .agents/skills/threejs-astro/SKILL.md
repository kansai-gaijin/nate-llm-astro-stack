---
name: threejs-astro
description: Implement or audit a framework-free Three.js experience in Astro when reference evidence or explicit user approval requires meaningful WebGL or 3D. Covers glTF assets, rendering quality, loading, responsive mobile budgets, accessibility fallbacks, lifecycle cleanup, and performance.
---

# Three.js for Astro

Do not add React Three Fiber or another UI runtime. Lazy-load a TypeScript scene controller from an
Astro component only when 3D materially supports the reference behavior or approved brand story.

- Use `Scene`, an appropriate camera, `WebGLRenderer`, and explicit controls/lifecycle ownership.
  Use production color space and tone mapping when required by the assets.
- Prefer glTF/GLB. Use Draco for models over roughly 1 MB and KTX2 for texture-heavy scenes when the
  delivery savings justify decoder cost. Preserve asset licenses/provenance.
- Clamp device pixel ratio, size the renderer with `ResizeObserver`, pause offscreen/hidden scenes,
  and avoid a permanent animation loop when rendering on demand works.
- Use instancing for large repeated meshes, merge static geometry where safe, add LOD for distant
  detail, and keep shadows/postprocessing within measured mobile budgets.
- Dispose geometry, every material/texture, controls, loaders/workers, render targets, observers,
  listeners, and the renderer. Force context loss only during final teardown.
- Provide a meaningful static image/poster and equivalent text. Disable or simplify on low-power,
  mobile, WebGL-unavailable, and reduced-motion paths without hiding required content.
- Coordinate any camera/object choreography through the approved motion system; never use linear,
  abrupt, or input-hostile movement.

Verify load size, frame pacing, memory after navigation, context loss/recovery, resize/orientation,
touch input, keyboard-accessible alternatives, reduced motion, and the static fallback.
