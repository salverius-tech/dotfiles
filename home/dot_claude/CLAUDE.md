# Claude Code — Personal Ruleset

Read `~/.agents/global/rules.md` for universal behavioral rules.
Read `~/.agents/adapters/claude/adapter.md` for Claude-specific tool usage, file operations, and skill discovery.

## Claude-Specific Critical Rules

- **Check for local `.claude/CLAUDE.md`** — Project rules append, reinforce, or replace conflicting rules from this file
- **Read before editing** — Always use Read tool before Edit/Write
- `make test` failing or showing warnings is ALWAYS an issue and must be fixed!
- **One question at a time** — Use AskUserQuestion tool with multiSelect: true when possible

## Auto-Activating Skills

**Skills load automatically when relevant** — conserving context for unrelated work.

### Core Workflows
- **Python**: uv-exclusive commands, zero warnings, CQRS/IoC patterns, testing after changes
- **Testing**: pytest, zero warnings policy, targeted tests, >80% coverage, mocking
- **Git**: Security scan, semantic commits, explicit push only
- **Web Projects**: package.json, React/Next.js/Vue patterns
- **Containers**: Docker Compose V2, 12-factor app, security-first, multi-stage builds

### Specialized
- **Multi-Agent AI**: .spec/ dirs, STATUS.md, lessons/
- **Development Philosophy**: BE BRIEF, autonomous execution, experiment-driven, fail-fast
- **Skill Creator**: Create, evaluate, benchmark, and optimize Claude skills and their descriptions

**Manual-only skills:**
- **Prompt Engineering**: `/optimize-prompt`, `/prompt-help` commands
- **Ruleset Optimization**: `/optimize-ruleset` command

See `~/.agents/adapters/claude/skills/*/SKILL.md` and `~/.claude/skills/*/SKILL.md` for details.

---

**See `~/.claude/CHANGELOG.md` for detailed change history.**
