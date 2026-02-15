---
name: introspection
description: "Meta-improvement patterns for analyzing interactions and improving rulesets. Triggers: /introspect, reviewing interactions, analyzing conversation patterns, improving CLAUDE.md, self-improvement, meta-learning."
---

# Introspection Skill

Guidelines for analyzing interactions to identify improvement opportunities. This skill provides the philosophy, pattern detection criteria, and improvement templates used by the `/introspect` command.

## Philosophy

### Continuous Improvement Loop
Every interaction is a learning opportunity. Problems encountered today should become prevented problems tomorrow through:
1. **Detection** - Recognize friction when it occurs
2. **Analysis** - Understand root cause
3. **Documentation** - Capture the fix
4. **Prevention** - Update rules/skills to prevent recurrence

### Signal vs Noise
Not every hiccup needs a rule. Focus on:
- **Recurring patterns** (happened 2+ times)
- **High-impact friction** (blocked progress significantly)
- **Teachable moments** (clear lesson with broad applicability)

Avoid:
- One-off misunderstandings due to ambiguous user input
- Edge cases unlikely to recur
- Over-specification that adds more context than it saves

## Problem Pattern Detection

### Correction Loops (HIGH Priority)

**Signals:**
- User says: "no", "that's not what I meant", "actually", "I meant", "not that"
- Same request rephrased after failed attempt
- User provides explicit correction

**Root Causes:**
- Ambiguous rule in CLAUDE.md
- Missing context about user preferences
- Incorrect assumption made

**Resolution Template:**
```markdown
When [situation], [do X] instead of [Y] because [reason].
```

### Re-explanation (HIGH Priority)

**Signals:**
- Same concept explained 2+ times in session
- "As I mentioned earlier" or "like I said"
- Context from early in session lost

**Root Causes:**
- Information not captured in accessible format
- Context window exceeded
- No persistent note created

**Resolution Template:**
Add to CLAUDE.local.md or create session note.

### Tool Misuse (MEDIUM Priority)

**Signals:**
- Used `bash grep` when Grep tool available
- Used `cat` when Read tool available
- Wrong tool selected, then corrected
- Inefficient tool sequence

**Root Causes:**
- Tool selection criteria unclear
- Habit from other environments
- Missing skill with tool guidance

**Resolution Template:**
```markdown
For [task type], prefer [tool] over [alternative] because [reason].
```

### Missing Context (MEDIUM Priority)

**Signals:**
- "Where is [file]?" questions
- Repeated lookups for same information
- "What was the [X] again?"
- Searching for documented but hard-to-find info

**Root Causes:**
- Information exists but not in expected location
- CLAUDE.md/skills missing key reference
- Documentation structure unclear

**Resolution Template:**
Add to Key Files table or appropriate section.

### Workflow Friction (MEDIUM Priority)

**Signals:**
- Multiple attempts to complete task
- Backtracking or undoing steps
- "Let me try a different approach"
- Process took longer than expected

**Root Causes:**
- Workflow not documented
- Steps missing from procedure
- Dependencies not clear

**Resolution Template:**
Create or update workflow documentation, or extract to command/agent.

## Opportunity Detection

### Reusable Workflow
**Signal:** Multi-step process completed successfully that could apply to future tasks.
**Action:** Consider creating `/command` or custom agent in CLAUDE.local.md.

### Domain Knowledge
**Signal:** Specific technical details discovered during session.
**Action:** Add to CLAUDE.local.md in appropriate section.

### Code Pattern
**Signal:** Solution pattern that could apply elsewhere in codebase.
**Action:** Add to Project Patterns section or create skill.

### Effective Tool Sequence
**Signal:** Combination of tools that worked well together.
**Action:** Document in relevant skill's Tool Grid.

## Severity Classification

### HIGH (H1-H5) - Must Address
| Code | Criteria | Example |
|------|----------|---------|
| H1 | Correction loop, 3+ occurrences | User corrected file path 3 times |
| H2 | Critical context missing | Build failed due to undocumented requirement |
| H3 | Workflow blocked | Couldn't proceed without clarification |
| H4 | Security/data issue | Almost committed secrets |
| H5 | Documented vs actual contradiction | Rule says X but reality is Y |

### MEDIUM (M1-M5) - Should Address
| Code | Criteria | Example |
|------|----------|---------|
| M1 | Correction loop, 1-2 occurrences | Minor misunderstanding corrected |
| M2 | Missing non-blocking docs | Had to search for info |
| M3 | Tool selection unclear | Used suboptimal tool first |
| M4 | Workflow inefficiency | Extra steps taken |
| M5 | Pattern worth extracting | Repeated procedure could be skill |

### LOW (L1-L5) - Nice to Have
| Code | Criteria | Example |
|------|----------|---------|
| L1 | Minor friction, workaround exists | Slightly awkward but worked |
| L2 | Polish opportunity | Could be cleaner |
| L3 | Example would help | Future sessions would benefit |
| L4 | Preference worth noting | User prefers X over Y |
| L5 | Nice-to-have improvement | Optional enhancement |

## Improvement Templates

### Rule Addition Template
```markdown
## [Section Name]

[Existing content...]

### [New Subsection if needed]
- [New rule]: [Explanation]
```

### Skill Extraction Template
```markdown
---
name: [skill-name]
description: "[Brief description]. Triggers: [comma-separated trigger words]."
---

# [Skill Title]

[Overview paragraph]

## [Main Content Sections]

## Tool Grid
| Task | Tool | Command |
|------|------|---------|
| ... | ... | ... |
```

### Agent Addition Template
```markdown
### @[agent-name]
**Purpose:** [One-line description]

**Steps:**
1. [First step]
2. [Second step]
3. [Continue as needed]
```

### Lesson Capture Template
```markdown
### Pattern: [Name]
- Context: [Why we needed this]
- Solution: [What worked] → [file:line if applicable]
- Gotcha: [What tripped us up]
- Use when: [Future scenarios]
```

## Target File Guidelines

| Content Type | Target File | Rationale |
|--------------|-------------|-----------|
| Project-wide rules | `CLAUDE.md` | Shared with team |
| Repo-specific knowledge | `CLAUDE.local.md` | Current project context |
| Personal preferences | `~/.claude/CLAUDE.md` | Applies to all projects |
| Domain procedures | `.claude/skills/[name]/SKILL.md` | Conditional loading |
| Reusable workflows | `.claude/commands/[name].md` | User-invoked |
| Micro-procedures | `CLAUDE.local.md` Custom Agents | Quick inline reference |
| Session learnings | `.session/feature/*/LESSONS.md` | Feature-specific |

## Anti-Patterns to Avoid

### Over-Documentation
❌ Adding a rule for every minor issue
✅ Only document recurring or high-impact patterns

### Vague Rules
❌ "Be careful with file paths"
✅ "Use forward slashes in paths, even on Windows, for cross-platform compatibility"

### Duplicate Information
❌ Same rule in CLAUDE.md and a skill
✅ Reference skill from CLAUDE.md, detail in skill only

### Context Bloat
❌ Adding paragraphs of explanation
✅ Bullets, tables, and examples that are quickly scannable

## Checkpoint Management

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

## VS Code Copilot Session Storage

### Data Source Location
Chat sessions are stored in VS Code's workspace-specific storage:
```
%APPDATA%\Code\User\workspaceStorage\{workspace-hash}\chatSessions\*.json
```

### Finding the Workspace Hash
1. Scan `%APPDATA%\Code\User\workspaceStorage\*\workspace.json`
2. Match `folder` field to current workspace (URL-encoded: `file:///c%3A/Dev/project-name`)
3. Use that directory's hash

### Session JSON Structure
```json
{
  "creationDate": 1770131457017,      // Unix timestamp (ms)
  "lastMessageDate": 1770135987184,
  "requests": [
    {
      "timestamp": 1770131540436,
      "modelId": "copilot/claude-opus-4.5",
      "message": { "text": "user prompt" },
      "response": [
        { "value": "assistant text" },           // kind=null
        { "kind": "toolInvocationSerialized" },  // tool calls  
        { "kind": "thinking" }                   // reasoning
      ]
    }
  ]
}
```

### Extracting Interaction Data
For pattern detection, extract:
| Field | Path | Use |
|-------|------|-----|
| User message | `requests[].message.text` | Detect correction loops |
| Assistant text | `requests[].response[].value` (where kind=null) | Analyze responses |
| Tool calls | `requests[].response[]` (where kind=toolInvocationSerialized) | Track tool usage |
| Timestamp | `requests[].timestamp` | Filter by checkpoint |
| Model | `requests[].modelId` | Context for analysis |

## Integration with Other Commands

| Command | Relationship |
|---------|--------------|
| `/optimize-ruleset` | Focuses on ruleset structure; `/introspect` focuses on interaction patterns |
| `/analyze-skills` | Focuses on skill activation; `/introspect` can recommend new skills |
| `/snapshot` | Captures session state; `/introspect` analyzes for improvements |
| `/commit` | After introspection changes, use to commit updates |

## Example Findings

### Example: Correction Loop Detected
```
Exchange 4:
  User: "Push to Gitea"
  Agent: Ran `git push gitea main`
  Result: Failed - no 'gitea' remote

Exchange 5:
  User: "There's no gitea remote, it mirrors from GitHub"
  Agent: Acknowledged, used GitHub push instead

Finding:
  Severity: H1 (correction required)
  Root Cause: CLAUDE.local.md mentions Gitea CI but not mirroring setup
  Recommendation: Add note about GitHub→Gitea mirroring
```

### Example: Missing Context Detected
```
Exchange 8:
  Agent: Searched workspace for CI monitoring approach
  Agent: Found scripts/gitea-ci.ps1 after grep search
  
Finding:
  Severity: M2 (non-blocking but caused extra steps)
  Root Cause: Utility script not in Key Files table
  Recommendation: Add to CLAUDE.local.md Key Files
```

### Example: Workflow Opportunity
```
Pattern: Created comprehensive tests, committed, pushed, monitored CI
This multi-step workflow was successful and repeatable.

Finding:
  Severity: L5 (nice-to-have)
  Opportunity: Could become @test-and-deploy agent
  Recommendation: Consider adding to Custom Agents section
```
