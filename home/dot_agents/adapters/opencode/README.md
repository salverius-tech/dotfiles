# OpenCode Adapter

Runtime-specific integration layer for [OpenCode](https://opencode.ai) connecting
canonical skills to the `@opencode-ai/plugin` tool API.

## Maestro Integration

The `maestro/` subdirectory contains the OpenCode-specific contract, validation scripts,
and schema sync checks for the Maestro tool suite.

```
maestro/
├── CONTRACT.md              OpenCode-specific contract (extends canonical)
├── check-contract.sh        Forbidden pattern checker for maestro.ts
└── tests/
    └── check-schema-sync.sh Verifies maestro.json ↔ maestro.ts sync
```

The runtime implementation lives at `~/.config/opencode/tools/maestro.ts`.
The canonical skill schemas live at `~/.agents/skills/maestro/`.

## Planner Configuration

| File             | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `planner.json`   | Role-adapter binding for planner agent       |
| `tools/maestro.json` | Reduced-surface schema for planning mode |
