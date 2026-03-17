# OpenCode Global Instructions

Read `~/.agents/global/rules.md` for universal behavioral rules.
Read `~/.agents/adapters/opencode/adapter.md` for OpenCode-specific skill discovery and tool integration.

## OpenCode-Specific Rules

- Use subagent tasks where possible to speed up work
- Always use `python` not `python3` in bash commands
- `make test` failing or showing warnings is ALWAYS an issue and must be fixed

## Skills

Skills load automatically when relevant. Portable skills are at `~/.agents/skills/*/knowledge.md`.
OpenCode adapter thin loaders are at `~/.agents/adapters/opencode/skills/*/SKILL.md`.

## Commands

- `/commit` — Git commit workflow with security scanning
- `/introspect` — Session analysis for ruleset improvement
