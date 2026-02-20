---
description: Review current session interactions to identify improvement opportunities for rulesets, skills, and agents
---

# Opencode Introspect Command

Analyze current session to identify patterns, problems, and opportunities for improving your rulesets and workflows.

## Prerequisite: Load Introspection Skill

**First, read the introspection skill for methodology:**
```
~/.claude/skills/introspection/SKILL.md
```

This skill contains the philosophy, pattern detection criteria, and severity classification used by this command.

## Reference

**For detailed process steps, see:**
```
~/.claude/commands/introspect.md
```

Note: That command is designed for VS Code Copilot and references VS Code storage. This command adapts it for opencode's session model.

## Opencode-Specific Process

### Scope
- **Current session only** - Analyzes the current conversation context
- No `--full` flag (unlike VS Code version)
- No checkpoint system needed

### Data Collection
Analyze the current conversation:
- Count exchanges (user messages + assistant responses)
- Identify topics discussed and tools used
- Note any corrections, clarifications, or re-explanations
- Track workflow patterns (what worked smoothly vs friction points)

### Problem Pattern Detection

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

### Opportunity Detection

Beyond problems, identify positive patterns:

| Opportunity | Signal | Description |
|-------------|--------|-------------|
| Reusable Workflow | Multi-step process completed successfully | Could become a command or agent |
| Domain Knowledge | Specific technical details discovered | Should be documented |
| Code Pattern | Solution that could apply elsewhere | Add to patterns section |
| Tool Combination | Effective tool sequence | Document in skill |

### Severity Classification

Using the introspection skill's tier system:

**HIGH Priority (H1-H5)**
- H1: Repeated correction loops (3+ occurrences)
- H2: Critical context missing from rules
- H3: Workflow blocked until clarified
- H4: Security or data handling issues
- H5: Contradictions between documented and actual behavior

**MEDIUM Priority (M1-M5)**
- M1: Correction loop (1-2 occurrences)
- M2: Missing but non-blocking documentation
- M3: Tool selection could be clearer
- M4: Workflow inefficiency identified
- M5: Pattern worth extracting to skill

**LOW Priority (L1-L5)**
- L1: Minor friction, workaround exists
- L2: Polish opportunity
- L3: Example could help future sessions
- L4: Preference worth noting
- L5: Nice-to-have improvement

## Output

Present findings in this format:

```
═══════════════════════════════════════════════════════════════
                    INTROSPECTION REPORT                        
═══════════════════════════════════════════════════════════════
 Mode: Opencode Current Session
 Scope: [N] exchanges
═══════════════════════════════════════════════════════════════
 FINDINGS                                                      
   HIGH:   [N] issues requiring attention                     
   MEDIUM: [N] improvements available                          
   LOW:    [N] polish opportunities                           
═══════════════════════════════════════════════════════════════
 RECOMMENDATIONS                                               
   Rules to add:     [N]                                       
   Skills to create: [N]                                       
   Lessons to capture: [N]                                     
═══════════════════════════════════════════════════════════════
```

Then list each recommendation with details including:
- Pattern detected (quote)
- Root cause
- Proposed fix (exact text to add)
- Target file (CLAUDE.md, CLAUDE.local.md, or skill)

## Approval & Application

Present choices:
1. Apply HIGH priority only
2. Apply HIGH + MEDIUM (recommended)
3. Apply ALL
4. Review individually (approve each)
5. Show proposed changes only (no apply)
6. Cancel

For approved changes:
- Create backup if needed
- Apply modification
- Show diff of changes

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No problems detected | Report "Clean session" with any opportunities |
| Single exchange only | Note limited data, analyze what's available |
| No corrections found | Focus on opportunities and positive patterns |

## Success Criteria

- Accurately detects correction loops and friction points
- Generates actionable, specific recommendations
- Respects approval workflow (no silent changes)
- Provides clear prioritization
- Improves interaction quality over time
