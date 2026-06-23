---
name: astro-design-loop
description: "Route reference-driven Astro work into three separate loops: literal reference cloning, content-and-brand design adaptation, then bounded post-approval updates. Use when selecting the correct workflow without mixing phase authority."
---

# Astro Three-Loop Router

Read `workflow/phase-state.json`.

- If the clone is not user-approved, invoke and follow `astro-reference-clone`. Do not read supplied
  page content and do not begin adaptation.
- When the clone becomes approved, end the current invocation and tell the user to run
  `$astro-content-design-loop` or `/astro-content-design-loop` separately.
- Invoke `astro-content-design-loop` only in that separate second invocation after clone approval.
- Invoke `astro-update-loop` only for later user-requested changes after adaptation approval and a
  shipping-valid final site.

Never mix clone, adaptation, or maintenance authority in one loop, iteration batch, or agent task.
