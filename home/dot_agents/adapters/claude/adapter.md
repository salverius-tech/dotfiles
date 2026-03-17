# Claude Code Adapter

How Claude Code connects to the unified `.agents/` knowledge base.

## Bootstrap Chain

1. **`~/.claude/CLAUDE.md`** — Claude's entrypoint. Imports this adapter and global rules.
2. **`~/.agents/global/rules.md`** — Universal behavioral rules (shared across all runtimes).
3. **This file** — Claude-specific tool usage, file operations, and skill discovery.

## Skill Discovery

Claude Code discovers skills from `~/.claude/skills/*/SKILL.md` (native path).

After migration, Claude-specific skills remain at:
- `~/.claude/skills/` — 5 Claude-only skills (claude-code-workflow, hooks-cross-platform, ptc-orchestration, ruleset-optimization, skill-creator)

Portable skill thin loaders live at:
- `~/.agents/adapters/claude/skills/*/SKILL.md` — 51 thin loaders pointing to `~/.agents/skills/*/knowledge.md`

**Chezmoi wires both locations** into Claude's skill search path via symlinks or direct deployment.

## Claude-Specific Rules

### File Operations
- **Read before Edit/Write** — Verify content first
- **Prefer Edit over Write** — For existing files
- Check file existence before creating

### Tool Preferences
- Specialized tools (Read/Edit/Grep/Glob) over bash commands
- Parallel execution for independent operations
- Task tool for complex multi-step work
- Complete ALL steps of clear-scope tasks without asking between steps

### TodoWrite Usage
**Use for:** 3+ step tasks, complex planning, user-requested lists
**Skip for:** Single/trivial tasks, informational requests
**Rules:** Mark first item in_progress immediately when starting; mark completed after each task; one in_progress max

### Question Handling
- **One question at a time** — Use AskUserQuestion tool with multiSelect: true when possible

### Build Enforcement
- `make test` failing or showing warnings is ALWAYS an issue and must be fixed

## Claude-Specific Pitfalls
- `/c/Users/...` paths in Python — use `os.path.expanduser('~/')`
- Committing without explicit request
- Manual .venv activation in uv projects — use `uv run`
- Unnecessary command flags — `-m` only for modules, not scripts
- Complex heredocs — use Task tool instead

### Platform-Specific (Windows)
- Python: Use `os.path.expanduser('~/')` NOT `/c/Users/...`
- Paths: Raw strings `r'C:\path'` or `chr(92)` for backslash
- Complex edits: Task tool over bash heredocs (escaping fragile)
- Home dir files: Task tool handles path resolution better

## Commands & Agents

Commands and agents remain in `~/.claude/`:
- `~/.claude/commands/*.md` — 14 custom slash commands
- `~/.claude/agents/*.md` — 5 specialized agent personas
- `~/.claude/hooks/` — Hook scripts
- `~/.claude/tools/` — Tool plugins

## Personality
- No toggle needed, people who use light mode are just wrong
- Use subagent tasks where possible to speed up work
- Always use `python` not `python3` in bash commands
