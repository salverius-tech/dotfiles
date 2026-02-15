# Personal Claude Code Commands

This directory contains custom slash commands available across all your projects.

## Quick Reference

| Command | Purpose | Arguments |
|---------|---------|-----------|
| `/analyze-permissions` | Analyze permission patterns from logs | - |
| `/analyze-skills` | Analyze skill activation patterns | - |
| `/commit [push]` | Create logical git commits | `push` (optional) |
| `/compare-setup <repo>` | Compare repo structures | GitHub URL or path |
| `/idea [slug]` | Capture and organize ideas | Optional slug name |
| `/introspect [--full]` | Review interactions for improvements | `--full` for all history |
| `/optimize-prompt <technique>` | Transform prompts using techniques | Technique name |
| `/optimize-ruleset [personal]` | Analyze and optimize CLAUDE.md | `personal` for ~/.claude |
| `/pickup [feature]` | Resume work from saved session | Feature name |
| `/prompt-help [framework]` | Documentation for analysis frameworks | Framework name or `all` |
| `/ptc <command>` | Run PTC multi-tool workflows | `scrape`, `browser`, `run` |
| `/snapshot [name]` | Capture session state snapshot | Feature name |
| `/snapshot-tracking <enable/disable>` | Toggle session context commits | `enable` or `disable` |

---

## Command Details

### `/analyze-permissions`

**Purpose**: Analyze permission patterns from debug logs and optionally add them to settings.json.

**Location**: `~/.claude/commands/analyze-permissions.md`

**What it does**:
1. **Pattern Analysis**: Scans debug logs to find frequently-requested permissions
2. **Safety Classification**: Groups patterns as SAFE or REVIEW NEEDED
3. **Interactive Approval**: Lets you choose which patterns to add
4. **Settings Update**: Automatically updates settings.json with approved patterns

**Usage**:
```bash
/analyze-permissions
```

**When to Use**:
- After using Claude Code for a while with new tools/commands
- When tired of approving the same commands repeatedly
- Periodically (weekly/monthly) to optimize your workflow

---

### `/analyze-skills`

**Purpose**: Analyze skill activation patterns and suggest trigger improvements.

**What it does**:
- Scans conversation history for skill activation patterns
- Detects missed activations
- Suggests improvements to trigger criteria

**Usage**:
```bash
/analyze-skills
```

---

### `/commit [push]`

**Purpose**: Create logical git commits with conventional format and optional push.

**What it does**:
- Scans for secrets before committing
- Categorizes files by type (docs, test, feat, fix, etc.)
- Generates conventional commit messages
- Optionally pushes after commit

**Usage**:
```bash
/commit          # Commit only
/commit push     # Commit and push
```

---

### `/compare-setup <target_repo>`

**Purpose**: Compare repository structures and generate improvement recommendations.

**Arguments**:
- `target_repo` (required): GitHub URL or path to compare against
- `implement` (optional): Set to `true` to auto-implement recommendations

**Usage**:
```bash
/compare-setup https://github.com/user/repo
/compare-setup /path/to/local/repo true
```

---

### `/idea [slug]`

**Purpose**: Brain dump mode - capture ideas quickly and make them actionable.

**What it does**:
- Creates structured idea folder in `.claude/ideas/`
- Extracts core concept, problem, and scope
- Creates actionable tasks

**Usage**:
```bash
/idea                    # Interactive naming
/idea my-new-feature     # Use specific slug
```

---

### `/introspect [--full]`

**Purpose**: Review interactions to identify improvement opportunities for CLAUDE.md, skills, and agents.

**Arguments**:
- No args: Analyze current session only
- `--full`: Analyze all history since last checkpoint
- `--dry-run`: Show what would be analyzed without changes

**Usage**:
```bash
/introspect        # Current session
/introspect --full # All history
```

---

### `/optimize-prompt [technique] <prompt>`

**Purpose**: Transform prompts using advanced prompting techniques.

**Techniques**:
- `meta-prompting`: AI improves the prompt itself
- `recursive-review`: Iterative refinement
- `deep-analyze`: Multi-layer analysis
- `multi-perspective`: View from different angles
- `deliberate-detail`: Add strategic detail
- `reasoning-scaffold`: Step-by-step reasoning structure
- `temperature-simulation`: Adjust style/tone

**Usage**:
```bash
/optimize-prompt "Create a Python function to..."
/optimize-prompt meta-prompting "Explain Docker..."
```

---

### `/optimize-ruleset [personal]`

**Purpose**: Analyze and optimize CLAUDE.md ruleset files with meta-learning from chat history.

**What it does**:
1. **Meta-Learning**: Analyzes chat history for patterns
2. **Ruleset Analysis**: Examines target CLAUDE.md for problems
3. **Smart Recommendations**: Combines insights
4. **Incremental**: Uses CHECKPOINT system for new history only

**Usage**:
```bash
/optimize-ruleset              # Project ruleset
/optimize-ruleset personal     # Personal ruleset (~/.claude/CLAUDE.md)
/optimize-ruleset --no-history # Skip history analysis
```

**When to Use**:
- After completing a project - capture learnings
- When starting a new project - optimize ruleset
- Periodically (weekly/monthly) - keep updated
- After frustrating sessions - turn pain points into rules

---

### `/pickup [feature-name]`

**Purpose**: Resume work from a saved session snapshot.

**What it does**:
- Shows all available session instances
- Restores context from `.session/feature/CURRENT.md`
- Loads todos, files, and recent work

**Usage**:
```bash
/pickup              # Show all available sessions
/pickup feature-name # Resume specific feature
```

---

### `/prompt-help [framework]`

**Purpose**: Documentation for structured-analysis frameworks.

**Frameworks** (12 total across 3 tiers):
- **Tier 1**: meta-prompting, recursive-review, deep-analyze, multi-perspective
- **Tier 2**: deliberate-detail, reasoning-scaffold, temperature-simulation
- **Tier 3**: adversarial-review, scope-boundary, idempotency-audit, zero-warning-verification, security-first-design, evidence-based-optimization

**Usage**:
```bash
/prompt-help              # Show all frameworks
/prompt-help meta-prompting # Specific framework docs
```

---

### `/ptc <command> [args...]`

**Purpose**: Run PTC (Programmatic Tool Calling) for efficient multi-tool workflows.

**Commands**:
- `scrape <urls...>`: Multi-URL scraping with summarization
- `browser "<instructions>"`: Browser automation pipeline
- `run "<prompt>"`: Custom PTC prompt execution

**Usage**:
```bash
/ptc scrape https://example.com https://site.com
/ptc browser "Find all links on the page"
/ptc run "Analyze this codebase structure"
```

---

### `/snapshot [feature-name]`

**Purpose**: Manually capture session state snapshot.

**What it does**:
- Saves current work context to `.session/feature/CURRENT.md`
- Captures todos, open files, recent changes
- Enables resuming work later with `/pickup`

**Usage**:
```bash
/snapshot              # Infer feature from context
/snapshot my-feature   # Explicit feature name
```

---

### `/snapshot-tracking <enable|disable>`

**Purpose**: Toggle automatic session context commits for current project.

**What it does**:
- Enables/disables automatic `.session/` commits
- Manages `.gitignore` configuration
- Updates CLAUDE.md markers

**Usage**:
```bash
/snapshot-tracking       # Show current status
/snapshot-tracking enable
/snapshot-tracking disable
```

---

## How to Create New Commands

1. Create a markdown file in `~/.claude/commands/`
2. Add frontmatter with description:
   ```markdown
   ---
   description: Brief description of what this command does
   ---
   ```
3. Write instructions for Claude
4. Commands become available as `/command-name`

Example:
```markdown
---
description: Commit changes with conventional commit format
---

# Commit Command

When this command is run:
1. Check git status
2. Generate commit message following conventional commits
3. Ask user for confirmation
4. Commit with attribution
```

---

## Best Practices

- **Keep commands focused** - One clear purpose per command
- **Be explicit** - Guide Claude step-by-step
- **Include examples** - Show what good looks like
- **Handle edge cases** - What if files don't exist?
- **Be educational** - Explain WHY, not just WHAT

---

**Created**: 2025-11-04
**Updated**: 2025-02-15 (Added all 13 commands)
