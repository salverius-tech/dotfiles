# OpenCode Global Instructions

Read `~/.agents/global/rules.md` for shared behavioral rules.
Read `~/.agents/adapters/opencode/adapter.md` for OpenCode-specific discovery,
tools, and runtime behavior.

## OpenCode workflow

- Use OpenCode-native tools for file inspection and editing when available.
- Use subagents when work is genuinely parallelizable, isolated, or independently
  reviewable; prefer direct execution for small or sequential tasks.
- Use the project's declared interpreter. Prefer `uv run` for uv-managed Python
  projects; otherwise verify whether `python3` or `python` is available.
- Run the narrowest relevant validation after changes. Treat warnings and failures
  as findings to investigate, while respecting the project's documented policy.
- Do not commit, push, deploy, or perform destructive operations without explicit
  user authorization.
- Before claiming completion, verify the changed artifact and report remaining
  uncertainty.

## Skills

Skills load when relevant. Portable skill knowledge is at:
`~/.agents/skills/*/knowledge.md`.
OpenCode adapter loaders are at:
`~/.agents/adapters/opencode/skills/*/SKILL.md`.

## Commands

- `/commit` — Git commit workflow with security scanning
- `/introspect` — Session analysis for ruleset improvement
