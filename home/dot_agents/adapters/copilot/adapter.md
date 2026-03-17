# Copilot Adapter

How GitHub Copilot connects to the unified `.agents/` knowledge base.

## Limitations

GitHub Copilot has **no global user-level configuration**. All instruction files are per-project:
- `.github/copilot-instructions.md` — repo-wide instructions
- `.github/instructions/*.instructions.md` — path-specific instructions
- `AGENTS.md` in repo root — OpenAI agents.md spec (also read by Copilot)

This means Copilot cannot automatically discover `~/.agents/` skills via dotfiles deployment. Each project must explicitly include relevant instructions.

## Skill Integration Strategy

For projects using Copilot, generate a `copilot-instructions.md` from the template:
- Template: `~/.agents/skills/github-templates/assets/copilot-instructions.md.template`

The template is a fill-in-the-blanks document that can reference portable skill knowledge inline or via project-local copies.

## Adapter Skills

Copilot-specific thin loaders exist at:
- `~/.agents/adapters/copilot/skills/*/SKILL.md`

These are currently limited to skills that have runtime-specific behavior (introspection, session-context-management). For most skills, Copilot projects should inline the relevant portions of `knowledge.md` into their `.github/copilot-instructions.md`.

## Per-Project Setup

To add `.agents/` knowledge to a Copilot-enabled project:

1. Copy the template: `~/.agents/skills/github-templates/assets/copilot-instructions.md.template`
2. Fill in project-specific sections
3. Optionally reference portable skills by including relevant `knowledge.md` content
4. Place at `.github/copilot-instructions.md` in the project repo

## Bootstrap Chain

Unlike Claude and OpenCode, Copilot has no global bootstrap file. The chain is:
1. `.github/copilot-instructions.md` — project-level instructions (manually maintained)
2. `.github/instructions/*.instructions.md` — path-specific overrides
3. `AGENTS.md` — if present in repo root
