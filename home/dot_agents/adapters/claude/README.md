# Claude Adapter

Runtime-specific integration layer for [Claude Code](https://claude.ai/code) connecting
canonical skills to Claude's native skill discovery system.

## Structure

```
claude/
├── adapter.md           How Claude connects to .agents/
├── README.md            This file
└── skills/              51 thin loader SKILL.md files
    ├── git-workflow/
    ├── python-workflow/
    └── ...
```

## Skill Loading

Claude discovers skills at `~/.claude/skills/*/SKILL.md`. Chezmoi deploys adapter
thin loaders to that path, each pointing to the canonical `~/.agents/skills/*/knowledge.md`.

5 Claude-specific skills remain directly in `~/.claude/skills/`:
- `claude-code-workflow` — Claude Code usage patterns
- `hooks-cross-platform` — Cross-platform hook scripts
- `ptc-orchestration` — Multi-URL scraping orchestration
- `ruleset-optimization` — CLAUDE.md optimization
- `skill-creator` — Skill creation and evaluation

## See Also

- `adapter.md` — Full bootstrap chain and Claude-specific rules
- `~/.agents/global/rules.md` — Universal rules shared across runtimes
- `~/.claude/CLAUDE.md` — Claude's entrypoint (imports adapter)
