# Pi Configuration

Managed global configuration for [Pi coding agent](https://pi.dev).

Installed target layout:

```text
~/.pi/agent/
├── AGENTS.md
├── settings.json
├── models.json
├── keybindings.json
├── prompts/
└── extensions/
```

Included extensions and workflows:

- `extensions/prompt-history.ts` adds project-local prompt history.
  - `Up` on an empty editor recalls recent prompts for the current project.
  - `Down` moves forward through recalled prompts and restores your pre-browse draft when you leave history.
  - Editing a recalled prompt exits history browsing immediately.
  - `/history` opens a searchable picker for older prompts and replaces the editor contents with the selected entry.
  - Prompt-history files are stored outside repositories under `~/.pi/agent/prompt-history/projects/<cwd-hash>.json`.
- `extensions/damage-control.ts` adds confirmations and path protections for destructive actions.

Runtime data such as sessions, auth files, installed packages, and prompt-history data remain local and should not be committed.
