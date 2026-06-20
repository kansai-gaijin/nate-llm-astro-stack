---
name: coding-best-practices
description: Implement or review production-quality web code for correctness, reuse, clear boundaries, strict types, accessibility, performance, security, testing, and maintainability. Use for application code, scripts, components, content adapters, integrations, refactors, and final verification in this starter.
---

# Coding Best Practices

## Design before editing

- Identify the authority for requirements, data, and current behavior.
- Make the smallest coherent change that achieves the full requirement; do not patch symptoms.
- Keep external services behind adapters and pure transformations separate from I/O.
- Prefer explicit code and types over clever abstraction. Abstract after a repeated stable pattern is
  visible, while creating obvious reusable primitives such as buttons and containers early.

## Maintain invariants

- Use strict types at boundaries and validate untrusted files, environment variables, CMS responses,
  and CLI input.
- Keep secrets out of client bundles, logs, fixtures, and version control.
- Preserve semantic HTML, keyboard behavior, focus, reduced motion, and accessible names.
- Handle empty, loading, error, offline/unavailable-service, and partial-data states deliberately.
- Avoid duplicated logic, hidden global state, floating promises, leaked listeners, and swallowed errors.

## Protect performance

- Ship only required client JavaScript. Lazy-load heavy animation/3D dependencies.
- Prevent layout shift; reserve media space and avoid forced synchronous layout in animation loops.
- Measure before adding caching, memoization, or complex optimization.

## Verify proportionately

- Run focused checks while iterating and the full declared suite before handoff.
- Test behavior, not implementation details. Keep visual baselines and audit evidence independent from
  the code that produces them.
- Never weaken a test or auditor conclusion merely to obtain green output.
- Report commands, results, untested areas, and known risks accurately.
