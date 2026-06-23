@AGENTS.md

## Claude Code adapter

Use `/astro-design-loop` only to route work. Run `/astro-reference-clone`, then after explicit
approval start `/astro-content-design-loop` in a new invocation. After final-site approval use
`/astro-update-loop` for bounded changes. Never combine the loops.

Optimize for Claude Opus 4.8 with high or xhigh effort when available. Its prompting is literal:
state the complete scope and apply rules explicitly to every named route, section, breakpoint, and
state. Explicitly request parallel read-only forensics and isolated section builders; do not assume
the model will spawn them. During clone work, prohibit creative house style and require computed
reference evidence. Native project subagents are in `.claude/agents/`; canonical skills are in
`.agents/skills/`.
