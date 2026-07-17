# Pi Global Instructions

Read `~/.agents/global/rules.md` for shared behavioral rules.
Read `~/.agents/adapters/pi/adapter.md` for Pi-specific tools, resources, and
session workflow.

## Pi workflow

- Read files before editing them.
- Prefer `edit` for targeted changes and `write` for new files or deliberate full
  rewrites.
- Use `bash` for repository inspection, tests, and commands that require a shell.
  Prefer native Pi file/search tools when they provide the needed capability.
- Use the project's declared interpreter and verify command availability; do not
  assume that `python` or `python3` is present.
- Run relevant validation after behavior-changing work when practical.
- Do not commit, push, deploy, or perform destructive operations without explicit
  user authorization.
- Ask only when ambiguity materially affects scope, safety, or the result; otherwise
  state important assumptions and proceed.
- Never write secrets, API keys, tokens, credentials, or private session data into
  managed dotfiles.
- Verify changed artifacts before claiming completion and explain which files changed.

## Dotfiles notes

- This machine uses chezmoi for dotfile deployment.
- Chezmoi source files live under `home/` in the dotfiles repository.
- Template files use chezmoi templating and may have OS-specific branches.
- Validate changes with `make test`, `make validate`, or targeted
  `chezmoi execute-template` checks when those tools are available.
