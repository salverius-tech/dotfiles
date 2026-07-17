---
name: dotfiles-maintenance
description: Maintain this chezmoi-managed dotfiles repository safely. Use when adding, changing, validating, or deploying files under the dotfiles source tree, especially agent configuration.
---

# Dotfiles Maintenance

This repository uses chezmoi. The source tree is the repository's `home/` directory;
managed names such as `dot_claude`, `dot_hermes`, and `private_dot_config` map to
paths in the user's home directory.

## Before editing

1. Inspect `git status` and the relevant source files.
2. Read repository guidance in `CLAUDE.md` and any applicable project instructions.
3. Check whether the target is a template, private file, script, or runtime state.
4. Keep credentials, auth files, sessions, memory databases, and caches unmanaged.

## Validation

Prefer the repository's checks:

```bash
make test
make validate
chezmoi execute-template < path/to/file.tmpl
chezmoi diff
```

Run only commands that exist in the current environment. Report missing prerequisites
instead of claiming that validation passed.

## Deployment

Use `chezmoi diff` before applying changes. Apply only after the user requests
installation or deployment. For agent configuration, verify the resulting paths,
then restart or reload the affected runtime only when requested and safe.

## Safety

Do not commit or push unless explicitly requested. Never overwrite runtime state
without checking its scope. Prefer a focused diff over broad regeneration, and do
not create ad hoc backup files inside the repository.
