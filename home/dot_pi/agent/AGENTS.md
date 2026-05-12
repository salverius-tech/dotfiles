# Pi Global Instructions

Read `~/.agents/global/rules.md` for universal behavioral rules.
Read `~/.agents/adapters/pi/adapter.md` for Pi-specific tool usage, file operations, and session workflow.

## Critical Rules

- Read files before editing them.
- Prefer `edit` for targeted modifications and `write` for new files or full rewrites.
- Use `bash` for repository inspection, tests, and file operations such as `find`/`rg`/`ls`.
- Be precise with paths and explain which files changed.
- Run relevant tests after code changes when practical.
- Do not commit or push unless explicitly asked.
- Ask one focused question only when blocked; otherwise proceed autonomously.
- Never write secrets, API keys, tokens, or credentials into managed dotfiles.

## Dotfiles Notes

- This machine uses chezmoi for dotfile deployment.
- Chezmoi source files live under `home/` in the dotfiles repository.
- Template files use chezmoi templating and may have OS-specific branches.
- Validate changes with `make test`, `make validate`, or targeted `chezmoi execute-template` checks.
