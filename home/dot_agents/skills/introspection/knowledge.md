# Introspection Skill

Guidelines for analyzing interactions to identify improvement opportunities. This skill provides the philosophy, pattern detection criteria, and improvement templates for continuous self-improvement.

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
- Ambiguous rule in ruleset file
- Missing context about user preferences
- Incorrect assumption made

**Resolution Template:**
```
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
Add to project-local ruleset file or create session note.

### Tool Misuse (MEDIUM Priority)

**Signals:**
- Used suboptimal tool when a better alternative was available
- Wrong tool selected, then corrected
- Inefficient tool sequence

**Root Causes:**
- Tool selection criteria unclear
- Habit from other environments
- Missing skill with tool guidance

**Resolution Template:**
```
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
- Ruleset/skills missing key reference
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
**Action:** Consider creating a command or custom agent.

### Domain Knowledge
**Signal:** Specific technical details discovered during session.
**Action:** Add to project-local config in appropriate section.

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
```
## [Section Name]

[Existing content...]

### [New Subsection if needed]
- [New rule]: [Explanation]
```

### Skill Extraction Template
```
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
```
### @[agent-name]
**Purpose:** [One-line description]

**Steps:**
1. [First step]
2. [Second step]
3. [Continue as needed]
```

### Lesson Capture Template
```
### Pattern: [Name]
- Context: [Why we needed this]
- Solution: [What worked] → [file:line if applicable]
- Gotcha: [What tripped us up]
- Use when: [Future scenarios]
```

## Anti-Patterns to Avoid

### Over-Documentation
- Adding a rule for every minor issue
- Only document recurring or high-impact patterns

### Vague Rules
- Bad: "Be careful with file paths"
- Good: "Use forward slashes in paths, even on Windows, for cross-platform compatibility"

### Duplicate Information
- Bad: Same rule in ruleset and a skill
- Good: Reference skill from ruleset, detail in skill only

### Context Bloat
- Bad: Adding paragraphs of explanation
- Good: Bullets, tables, and examples that are quickly scannable

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
  Root Cause: Project config mentions Gitea CI but not mirroring setup
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
  Recommendation: Add to project config Key Files
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
