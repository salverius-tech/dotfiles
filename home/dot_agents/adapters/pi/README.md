# Pi Adapter

Pi-specific glue for the unified `~/.agents` system.

This adapter is loaded from `~/.pi/agent/AGENTS.md` and Pi settings. It keeps Pi prompt templates, extensions, and skill wrappers separate from Claude/OpenCode-specific resources while reusing the canonical agent rules under `~/.agents`.

## Layout

```text
adapters/pi/
├── adapter.md       # Pi-specific operating rules
├── extensions/      # Optional Pi TypeScript extensions
├── prompts/         # Optional Pi prompt templates
├── skills/          # Optional Pi Agent Skill wrappers
└── themes/          # Optional Pi themes
```

Global Pi configuration lives in `~/.pi/agent/` and may reference this adapter.
