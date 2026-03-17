---
name: introspection
description: "Meta-improvement patterns for analyzing interactions and improving rulesets. Triggers: /introspect, reviewing interactions, analyzing conversation patterns, improving CLAUDE.md, self-improvement, meta-learning."
---

**Auto-activate when:** User mentions /introspect, reviewing interactions, analyzing conversation patterns, improving CLAUDE.md, self-improvement, or meta-learning.

Read `~/.agents/skills/introspection/knowledge.md` for the full guidelines. Note: the path is `~/.agents`, not `~/.claude`.

## Claude-Specific: Checkpoint Management

The `/introspect --full` command uses a checkpoint file to enable incremental analysis:

**Location:** `.claude/INTROSPECTION_CHECKPOINT`

**Format:**
```
YYYY-MM-DDTHH:MM:SSZ
```

**Behavior:**
- First run: Analyze all available history (up to 7 days)
- Subsequent runs: Only analyze new messages since checkpoint
- Updated after each `--full` analysis completes
- Not updated for current-session-only analysis

## Claude-Specific: Target File Guidelines

| Content Type | Target File | Rationale |
|--------------|-------------|-----------|
| Project-wide rules | `CLAUDE.md` | Shared with team |
| Repo-specific knowledge | `CLAUDE.local.md` | Current project context |
| Personal preferences | `~/.claude/CLAUDE.md` | Applies to all projects |
| Domain procedures | `.claude/skills/[name]/SKILL.md` | Conditional loading |
| Reusable workflows | `.claude/commands/[name].md` | User-invoked |
| Micro-procedures | `CLAUDE.local.md` Custom Agents | Quick inline reference |
| Session learnings | `.session/feature/*/LESSONS.md` | Feature-specific |

## Claude-Specific: Command Integration

| Command | Relationship |
|---------|--------------|
| `/optimize-ruleset` | Focuses on ruleset structure; `/introspect` focuses on interaction patterns |
| `/analyze-skills` | Focuses on skill activation; `/introspect` can recommend new skills |
| `/snapshot` | Captures session state; `/introspect` analyzes for improvements |
| `/commit` | After introspection changes, use to commit updates |
