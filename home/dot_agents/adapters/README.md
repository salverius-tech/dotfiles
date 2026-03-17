# Adapters

Runtime-specific integration layers connecting the canonical `.agents/` knowledge base
to individual agent runtimes (Claude Code, OpenCode, Copilot).

Adapters may reference skills but must not redefine them.

## Structure

```
adapters/
├── claude/
│   ├── adapter.md       Bootstrap chain, tool preferences, Claude-specific rules
│   ├── README.md        Claude adapter documentation
│   └── skills/          51 Claude thin loaders → ~/.agents/skills/*/knowledge.md
├── opencode/
│   ├── adapter.md       Skill discovery, Maestro integration, commands
│   ├── README.md        OpenCode adapter documentation
│   ├── skills/          51 OpenCode thin loaders → ~/.agents/skills/*/knowledge.md
│   ├── maestro/         Maestro tool contract and validation
│   └── planner.json     Role-adapter binding
└── copilot/
    ├── adapter.md       Per-project limitations, template strategy
    └── skills/          2 Copilot-specific thin loaders
```

## Rules

- Adapters must not contain tool definitions
- Adapters must not contain role instructions
- Adapters must not redefine skill knowledge
- Each adapter's `adapter.md` documents how its runtime discovers and loads skills
