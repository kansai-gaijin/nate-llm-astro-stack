---
name: astro-design-loop
description: "Route reference-driven Astro work into two strictly separate loops. Use when starting the overall workflow: run the literal reference-clone phase first, stop for explicit user approval, and run content adaptation only in a later invocation after clone approval."
---

# Astro Design Loop Router

Read `workflow/phase-state.json`.

- If the clone is not user-approved, invoke and follow `astro-reference-clone`. Do not read supplied
  page content and do not begin adaptation.
- When the clone becomes approved, end the current invocation and tell the user to run
  `$astro-content-adaptation` or `/astro-content-adaptation` separately.
- Invoke `astro-content-adaptation` only when the user starts that separate phase and the phase state
  confirms the clone is approved.

Never perform cloning and content adaptation in one loop, one iteration batch, or one agent task.
