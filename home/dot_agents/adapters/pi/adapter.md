# Pi Adapter

Pi-specific guidance for the shared `~/.agents` system.

## Tool usage

- Use `read` to inspect files before editing.
- Use `edit` for precise, targeted replacements.
- Use `write` only for new files or deliberate full rewrites.
- Use `bash` for shell execution, repository inspection, tests, and project-provided
  commands. Prefer native Pi tools when they provide the needed capability.
- Use the project's declared runtime and interpreter; verify command availability.
- Do not commit or push unless explicitly asked.

## Pi resources

Pi loads resources from:

- `~/.pi/agent/AGENTS.md` — global Pi context
- `~/.pi/agent/settings.json` — global Pi settings
- `~/.pi/agent/prompts/*.md` — slash prompt templates
- `~/.pi/agent/extensions/*.ts` — extensions
- `~/.pi/agent/skills/` and `~/.agents/skills/` — Agent Skills
- `.pi/` and `.agents/` — project-level resources

Verify that a resource is enabled or discoverable in the active Pi configuration;
presence in the dotfiles repository alone does not activate it.

## Maestro integration

Pi can load the Maestro extension from:
`~/.agents/adapters/pi/extensions/maestro.ts`.

Tool names and capabilities are derived from the active Maestro manifest and server
capabilities. Use canonical `maestro_` names, and do not assume a fixed tool count
or authorization scope. `MAESTRO_BASE_URL` and, when required,
`MAESTRO_API_KEY` configure the connection.

Server-controlled capabilities such as shell, Docker, and memory cannot be bypassed
by Pi. Verify the extension, server health, and scoped-key permissions separately.

## Session workflow

- Use `/tree`, `/fork`, and `/compact` for long sessions when useful.
- Use `/pickup` to inspect repository state and resume work.
- Use `/snapshot` to create compact project state before ending a long task.
- Use `pi -c` to continue the latest session and `pi -r` to use the session picker.

## Safety

- Never write secrets or local credentials into managed dotfiles.
- Confirm scope before destructive shell commands or external side effects.
- Do not modify `.env`, SSH keys, credential stores, or authentication files unless
  explicitly requested and safely scoped.
- Treat third-party Pi packages and extensions as trusted code with system access;
  review them before installing.
- Verify changed artifacts and relevant checks before reporting completion.
