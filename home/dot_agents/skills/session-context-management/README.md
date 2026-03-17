# Session Context Management

Maintain "just enough" context across work sessions using CURRENT.md, STATUS.md, and LESSONS.md files.

## Files

- `knowledge.md` — Canonical skill content (runtime-agnostic)

## Runtime Adapters

This skill has runtime-specific adapters in `~/.agents/adapters/`:
- `claude/skills/session-context-management/SKILL.md` — Claude Code instance/session detection
- `copilot/skills/session-context-management/SKILL.md` — VS Code workspace detection
- `opencode/skills/session-context-management/SKILL.md` — OpenCode session detection
