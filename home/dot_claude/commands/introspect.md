---
description: Review interactions to identify improvement opportunities for CLAUDE.md, skills, and agents
argument-hint: --full
---

# Introspect Command

Analyze current session (or full history with `--full`) to identify patterns, problems, and opportunities for improving the ruleset, skills, and agents. All changes require explicit approval.

## Prerequisite: Load Introspection Skill

**Before proceeding, read the introspection skill file:**
```
.claude/skills/introspection/SKILL.md
```
This skill contains the philosophy, pattern detection criteria, and improvement templates used by this command.

## Parameters
- No parameter: `/introspect` → Analyze current session only
- `--full`: `/introspect --full` → Analyze all history since last INTROSPECTION_CHECKPOINT
- `--dry-run`: Show what would be analyzed without generating recommendations

## Process Overview
1. Determine scope (current session vs full history)
2. Collect interaction data from appropriate sources
3. Detect problem patterns and friction points
4. Classify findings by severity (HIGH/MEDIUM/LOW)
5. Generate improvement recommendations with specific targets
6. Present unified report for approval
7. Apply approved changes

## PHASE 1: Scope & Data Collection

### Current Session Mode (default)
Analyze the current conversation context:
- Count exchanges (user messages + assistant responses)
- Identify topics discussed and tools used
- Note any corrections, clarifications, or re-explanations
- Track workflow patterns (what worked smoothly vs friction points)

### Full History Mode (`--full`)
Read checkpoint from `.claude/INTROSPECTION_CHECKPOINT`. If no checkpoint exists, analyze last 7 days of history.

**Data Sources (VS Code Copilot Chat):**

Primary source is VS Code's workspace-specific chat session storage:
```
%APPDATA%\Code\User\workspaceStorage\{workspace-hash}\chatSessions\*.json
```

**Workspace Hash Discovery:**
1. Scan all directories in `%APPDATA%\Code\User\workspaceStorage\`
2. Read `workspace.json` in each directory
3. Match `folder` field against current workspace path (URL-encoded format: `file:///c%3A/Dev/reztech-daily-ops`)
4. Use the matching directory's hash

**Session File Structure:**
```json
{
  "sessionId": "uuid",
  "creationDate": 1770131457017,      // Unix timestamp (ms)
  "lastMessageDate": 1770135987184,
  "requests": [
    {
      "timestamp": 1770131540436,
      "modelId": "copilot/claude-opus-4.5",
      "message": { "text": "user prompt" },
      "response": [
        { "value": "assistant text" },           // text (kind=null)
        { "kind": "toolInvocationSerialized" },  // tool calls
        { "kind": "thinking" },                   // thinking blocks
        { "kind": "textEditGroup" }               // file edits
      ]
    }
  ]
}
```

**Fallback sources** (if session management is used):
- `.session/feature/*/STATUS.md` - Tracked session outcomes
- `.session/feature/*/LESSONS.md` - Captured patterns from past features
- Check if these exist before attempting to read them

Filter by:
- `creationDate`/`lastMessageDate` (since last checkpoint)
- Workspace path match (current workspace only)

Update checkpoint with current timestamp after analysis.

## PHASE 2: Problem Pattern Detection

Scan for these interaction anti-patterns:

| Pattern | Signal | Severity | Description |
|---------|--------|----------|-------------|
| Correction Loop | "no", "that's not what I meant", "actually" | HIGH | User had to correct misunderstanding |
| Re-explanation | Same concept explained 2+ times | HIGH | Context was lost or unclear |
| Tool Misuse | Wrong tool selected, then corrected | MEDIUM | Tool selection rules unclear |
| Missing Context | "where is", "what file", repeated lookups | MEDIUM | Documentation gap |
| Workflow Friction | Multiple attempts, backtracking | MEDIUM | Process not documented |
| Ambiguous Request | Clarifying questions needed | LOW | User prompt patterns |
| Slow Path | Inefficient approach taken first | LOW | Better patterns exist |

For each detected pattern:
- Quote the relevant exchange (abbreviated)
- Identify root cause
- Suggest specific improvement

## PHASE 3: Opportunity Detection

Beyond problems, identify positive patterns worth capturing:

| Opportunity | Signal | Description |
|-------------|--------|-------------|
| Reusable Workflow | Multi-step process completed successfully | Could become a command or agent |
| Domain Knowledge | Specific technical details discovered | Should be documented |
| Code Pattern | Solution that could apply elsewhere | Add to patterns section |
| Tool Combination | Effective tool sequence | Document in skill |

## PHASE 4: Classification & Prioritization

Classify all findings using severity tiers (matching `/optimize-ruleset`):

### HIGH Priority (H1-H5)
- H1: Repeated correction loops (3+ occurrences)
- H2: Critical context missing from CLAUDE.md
- H3: Workflow blocked until clarified
- H4: Security or data handling issues
- H5: Contradictions between documented and actual behavior

### MEDIUM Priority (M1-M5)
- M1: Correction loop (1-2 occurrences)
- M2: Missing but non-blocking documentation
- M3: Tool selection could be clearer
- M4: Workflow inefficiency identified
- M5: Pattern worth extracting to skill

### LOW Priority (L1-L5)
- L1: Minor friction, workaround exists
- L2: Polish opportunity
- L3: Example could help future sessions
- L4: Preference worth noting
- L5: Nice-to-have improvement

## PHASE 5: Generate Recommendations

For each finding, generate a specific recommendation:

### Rule Additions
Target: `CLAUDE.md` or `CLAUDE.local.md`
```markdown
## Recommendation: [Title]
**Severity:** HIGH/MEDIUM/LOW
**Pattern Detected:** [Quote from interaction]
**Root Cause:** [Why this happened]
**Proposed Addition:**
> [Exact text to add]
**Target File:** [path]
**Target Section:** [section header]
```

### Skill Extractions
Target: `.claude/skills/[name]/SKILL.md`
```markdown
## Recommendation: Extract Skill
**Severity:** MEDIUM
**Content:** [What to extract]
**Rationale:** [Why this deserves a skill]
**Proposed Skill Name:** [name]
**Estimated Token Savings:** [X tokens when inactive]
```

### Agent Additions
Target: `CLAUDE.local.md` Custom Agents section
```markdown
## Recommendation: New Agent
**Severity:** LOW
**Use Case:** [When to use]
**Proposed Agent:**
> ### @agent-name
> **Purpose:** [description]
> **Steps:**
> 1. [step]
```

### Lesson Captures
Target: `.session/feature/[current]/LESSONS.md` (if session management active)
  OR `~/.claude/LESSONS.md` (for global lessons)
  OR project-specific documentation

```markdown
## Recommendation: Capture Lesson
**Severity:** LOW
**Pattern:** [What we learned]
**Proposed Entry:**
> ### Pattern: [Name]
> - Context: [Why we needed this]
> - Solution: [What worked]
> - Use when: [Future scenarios]
```

**Note:** Only suggest lesson capture if session-context-management skill is active or user explicitly tracks lessons.

## PHASE 6: Present Report

Display unified report:

```
╔══════════════════════════════════════════════════════════════╗
║                    INTROSPECTION REPORT                       ║
╠══════════════════════════════════════════════════════════════╣
║ Mode: [Current Session / Full History]                        ║
║ Scope: [N exchanges / N messages since DATE]                  ║
║ Project: [workspace path]                                     ║
╠══════════════════════════════════════════════════════════════╣
║ FINDINGS                                                      ║
║   HIGH:   [N] issues requiring attention                      ║
║   MEDIUM: [N] improvements available                          ║
║   LOW:    [N] polish opportunities                            ║
╠══════════════════════════════════════════════════════════════╣
║ RECOMMENDATIONS                                               ║
║   Rules to add:     [N] (CLAUDE.md: X, CLAUDE.local.md: Y)   ║
║   Skills to create: [N]                                       ║
║   Agents to add:    [N]                                       ║
║   Lessons to capture: [N]                                     ║
╚══════════════════════════════════════════════════════════════╝
```

Then list each recommendation with full details.

## PHASE 7: Approval & Application

Present choices:
1. Apply HIGH priority only
2. Apply HIGH + MEDIUM (recommended)
3. Apply ALL
4. Review individually (approve each recommendation)
5. Show proposed changes only (no apply)
6. Cancel

For each approved change:
- Create backup of target file (`.backup` suffix)
- Apply modification
- Verify markdown validity
- Show diff of changes

## PHASE 8: Update Checkpoint

After applying approved changes (or completing analysis with no changes):

1. Write current ISO timestamp to `.claude/INTROSPECTION_CHECKPOINT`
2. Format: `YYYY-MM-DDTHH:MM:SS` (e.g., `2026-02-04T21:30:00`)
3. This marks the cutoff for the next `--full` run

**Note:** Only update checkpoint after `--full` mode, not current session mode.

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No problems detected | Report "Clean session" with any opportunities found |
| No history.jsonl (--full) | Fall back to current session analysis |
| Missing CLAUDE.local.md | Create with header if recommendations target it |
| Conflicting recommendations | Flag for manual review, don't auto-merge |
| First introspection ever | Skip checkpoint filtering, analyze available data |

## Success Criteria

- Accurately detects correction loops and friction points
- Generates actionable, specific recommendations
- Respects approval workflow (no silent changes)
- Creates valid backups before modifications
- Updates checkpoint after full analysis
- Handles edge cases gracefully
- Improves interaction quality over time

## Example Session

```
User: /introspect

╔══════════════════════════════════════════════════════════════╗
║                    INTROSPECTION REPORT                       ║
╠══════════════════════════════════════════════════════════════╣
║ Mode: Current Session                                         ║
║ Scope: 12 exchanges                                           ║
║ Project: [current workspace path]                             ║
╠══════════════════════════════════════════════════════════════╣
║ FINDINGS                                                      ║
║   HIGH:   1 issue requiring attention                         ║
║   MEDIUM: 2 improvements available                            ║
║   LOW:    1 polish opportunity                                ║
╚══════════════════════════════════════════════════════════════╝

## H1: Correction Loop - Tool Selection
**Pattern:** User asked to "find all TODOs" but agent used bash grep 
instead of the Grep tool. User corrected: "Use Grep tool instead."
**Root Cause:** CLAUDE.md does not specify tool preference hierarchy.
**Recommendation:** Add to CLAUDE.md Tool Usage section:
> Prefer specialized tools (Read/Edit/Grep/Glob) over Bash commands

## M1: Missing Context - Project Structure
**Pattern:** Agent asked "Where is the main entry point?" multiple times.
**Root Cause:** No project overview in CLAUDE.local.md.
**Recommendation:** Add Architecture Overview section to CLAUDE.local.md.

[... more recommendations ...]

Select action:
1. Apply HIGH only
2. Apply HIGH + MEDIUM (recommended)
3. Apply ALL
4. Review individually
5. Show changes only
6. Cancel

>
```
