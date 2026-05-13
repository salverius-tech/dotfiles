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

## Maestro Integration

The `extensions/maestro.ts` extension registers Pi tools for the current Maestro executor API. It uses the canonical `~/.agents/skills/maestro/maestro.json` registry and canonical adapter naming (`maestro_` prefix, dots converted to underscores):

- `memory.put` → `maestro_memory_put`
- `vector.list_collections` → `maestro_vector_list_collections`
- `docker_run` → `maestro_docker_run`

Runtime requirements:

- `MAESTRO_BASE_URL` must be set for tool calls.
- `MAESTRO_API_KEY` is sent as `X-API-Key` when set.
- `MAESTRO_CLIENT_TIMEOUT_MS` optionally overrides the default 310s client timeout.

Validation and Pi-specific contract files live under `maestro/`.
