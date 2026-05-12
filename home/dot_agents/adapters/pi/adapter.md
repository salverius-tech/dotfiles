# Pi Adapter

Pi-specific instructions for the unified `~/.agents` system.

## Tool Usage

- Use `read` to inspect files before editing.
- Use `edit` for precise, targeted replacements.
- Use `write` only for new files or deliberate full rewrites.
- Use `bash` for repository inspection, tests, and file operations (`find`, `rg`, `ls`, `git`, `make`).
- Prefer project-provided commands (`make test`, `npm test`, `pytest`, etc.) over ad hoc commands.
- Do not commit or push unless explicitly asked.

## Pi Resources

Pi loads resources from:

- `~/.pi/agent/AGENTS.md` for global Pi context
- `~/.pi/agent/settings.json` for global Pi settings
- `~/.pi/agent/prompts/*.md` for slash prompt templates
- `~/.pi/agent/extensions/*.ts` for extensions
- `~/.pi/agent/skills/` and `~/.agents/skills/` for Agent Skills
- `.pi/` and `.agents/` directories in projects for project-level resources

## Session Workflow

- Use `/tree`, `/fork`, and `/compact` for long sessions instead of losing context.
- Use `/pickup` to inspect repo state and resume work.
- Use `/snapshot` to create a compact project status file before ending a long task.
- Use `pi -c` to continue the latest session and `pi -r` to resume from a session picker.

## Safety

- Never write secrets or local credentials into managed dotfiles.
- Avoid destructive shell commands without user confirmation.
- Do not modify `.env`, SSH keys, credential stores, or auth files.
- Treat third-party Pi packages/extensions as trusted code with full system access; review before installing.
