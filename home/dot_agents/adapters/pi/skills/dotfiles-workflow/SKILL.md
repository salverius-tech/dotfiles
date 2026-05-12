---
name: dotfiles-workflow
description: Chezmoi-managed cross-platform dotfiles workflow. Use when editing this dotfiles repository, chezmoi templates, shell profiles, package scripts, or AI agent configuration.
---

# Dotfiles Workflow

Read these first when available:

- `CLAUDE.md` in the repository root
- `~/.agents/skills/dotfiles-workflow/knowledge.md`
- `~/.agents/adapters/pi/adapter.md`

## Rules

- Chezmoi source files live under `home/`.
- Use `dot_` and `private_dot_` prefixes correctly.
- Keep templates cross-platform and validate both Linux and Windows branches where practical.
- Prefer `run_onchange_*` for idempotent installers that should re-run after script changes.
- Never commit secrets or host-specific credentials.
- Validate changes with `make test`, `make validate`, or targeted `chezmoi execute-template` checks.
