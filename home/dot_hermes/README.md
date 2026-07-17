# Hermes Agent Configuration

This directory contains the Hermes-specific portion of the chezmoi dotfiles
repository.

## Managed layout

```text
home/dot_hermes/
├── SOUL.md                         # Global Hermes identity
├── skills/<name>/SKILL.md          # Hermes-native, user-owned skills
└── skill-bundles/<name>.yaml       # Composable Hermes slash-command bundles
```

After chezmoi deployment, these map to:

```text
~/.hermes/SOUL.md
~/.hermes/skills/<name>/SKILL.md
~/.hermes/skill-bundles/<name>.yaml
```

Runtime state is intentionally not managed here. Do not commit auth files,
sessions, memory databases, `.hub` skill metadata, cron state, plugin caches, or
credentials.

## Applying the configuration

Preview source changes before deployment:

```bash
chezmoi diff
```

Apply only after reviewing the diff:

```bash
chezmoi apply ~/.hermes/SOUL.md
chezmoi apply ~/.hermes/skills
chezmoi apply ~/.hermes/skill-bundles
```

If the current chezmoi version does not accept directory targets, run:

```bash
chezmoi apply
```

and inspect the resulting paths afterward.

## Skills

Hermes discovers each installed skill's `SKILL.md` on demand. Use:

```bash
hermes skills list
hermes skills check
hermes skills audit
```

The repository's skills are intentionally focused on workflows specific to this
environment. Shared cross-runtime knowledge remains under `home/dot_agents/`.

## Shared skills

To expose compatible skills from the shared knowledge base, configure an external
skill directory in the active Hermes profile's `~/.hermes/config.yaml`:

```yaml
skills:
  external_dirs:
    - ~/.agents/skills
```

The external directory must contain Hermes-compatible skill directories with a
`SKILL.md`; the current `home/dot_agents/skills/*/knowledge.md` files are canonical
shared knowledge but are not automatically Hermes-native skills. Add a Hermes
wrapper or migrate a skill deliberately before enabling it here.

External directories are not read-only boundaries. Use filesystem permissions if
shared skills must not be modified by Hermes.

## Bundles

Bundles group installed skills under one slash command. They do not install skills
themselves. After deployment, inspect them with:

```bash
hermes bundles list
hermes bundles show hermes-ops
```

Available repository bundles include:

- `/hermes-ops`
- `/dotfiles-maintenance`
- `/development`
- `/automation`

## Plugins

Plugins are separate from skills and bundles. Add a plugin only when it needs tools,
event hooks, or runtime registration. Verify installation, enabled state, gateway
loading, advertised tools, and any companion service independently. See the
`plugin-runtime-verification` skill for the verification procedure.

For Hermes commands and configuration behavior, use the authoritative documentation:
https://hermes-agent.nousresearch.com/docs
