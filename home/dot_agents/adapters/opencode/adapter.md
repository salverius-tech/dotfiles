# OpenCode Adapter

How OpenCode connects to the unified `.agents/` knowledge base.

## Bootstrap Chain

1. **`~/.config/opencode/AGENTS.md`** — OpenCode's global instructions file. Imports this adapter and global rules.
2. **`~/.agents/global/rules.md`** — Universal behavioral rules (shared across all runtimes).
3. **This file** — OpenCode-specific skill discovery, tool integration, and runtime quirks.

## Skill Discovery

OpenCode searches multiple paths for `SKILL.md` files (in order):
1. `.opencode/skills/` — project-local
2. `~/.config/opencode/skills/` — user global
3. `.claude/skills/` — Claude compat (project)
4. `~/.claude/skills/` — Claude compat (global)
5. `.agents/skills/` — agents (project)
6. `~/.agents/skills/` — agents (global)

Portable skill thin loaders live at:
- `~/.agents/adapters/opencode/skills/*/SKILL.md` — 51 thin loaders pointing to `~/.agents/skills/*/knowledge.md`

OpenCode also natively reads `~/.agents/skills/*/SKILL.md` if present (path 6 above).

**To use adapter-specific loaders**, configure `opencode.json` instructions field or symlink into a discovered path.

## Maestro Integration

The `maestro/` subdirectory contains the OpenCode-specific contract for the Maestro tool suite:

```
maestro/
├── CONTRACT.md              OpenCode-specific contract
├── check-contract.sh        Forbidden pattern checker
└── tests/
    └── check-schema-sync.sh Schema sync verification
```

Runtime implementation: `~/.config/opencode/tools/maestro.ts`
Canonical skill schemas: `~/.agents/skills/maestro/`

Tool exports use canonical adapter names only: prefix `maestro_` and replace dots from Maestro manifest names with underscores (`vector.list_collections` → `maestro_vector_list_collections`). Legacy `maestro_vector_collections_*` aliases are intentionally unsupported.

## Planner Configuration

| File           | Purpose                                |
| -------------- | -------------------------------------- |
| `planner.json` | Role-adapter binding for planner agent |

The planner role's tool schema is defined at `~/.agents/roles/planner/tools/maestro.json`.

## Commands

OpenCode commands live at `~/.opencode/commands/*.md`:
- `commit.md` — Git commit workflow (delegates to `~/.agents/skills/git-workflow/knowledge.md`)
- `introspect.md` — Meta-improvement analysis (delegates to `~/.agents/skills/introspection/knowledge.md`)

## Tool Plugins

Custom tools at `~/.config/opencode/tools/`:
- `maestro.ts` — Maestro API integration
- `sanity.ts` — Sanity check utilities

## OpenCode-Specific Notes

- To disable Claude compatibility paths: set `OPENCODE_DISABLE_CLAUDE_CODE=1`
- Agent definitions: `~/.config/opencode/agents/*.md` or `.opencode/agents/*.md`
- OpenCode reads `AGENTS.md` (not `CLAUDE.md`) as its primary global instructions file
