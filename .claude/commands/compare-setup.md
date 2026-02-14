---
description: Compare repository structures and generate improvement recommendations
model: haiku
args:
  - name: target_repo
    description: GitHub URL or path to repository to compare against
    required: true
  - name: implement
    description: Whether to implement recommendations (true/false)
    required: false
    default: "false"
---

# Repository Setup Comparison & Review

Compare the current repository's `.claude` directory structure against a target repository, identify gaps, and generate actionable improvement recommendations.

## Execution Workflow

### 1. Analyze Target Repository
Fetch and analyze the target repository's `.claude` structure:

```bash
# Parse the target repo argument
target_repo="$1"
implement_mode="$2"
```

Use webfetch or task tools to explore the target repository's structure:

```
Fetch complete directory structure from target_repo/.claude
List all subdirectories (agents, commands, skills, hooks, tools, docs, etc.)
Count files in each category
Read key configuration files (settings.json, CLAUDE.md, README.md)
Sample representative files from each major category
```

### 2. Analyze Local Repository
Compare against the current repository's `.claude` structure:

```bash
find .claude -type f | wc -l
find .claude -type d | sort
ls -la .claude/
```

### 3. Generate Comparison Report

Create a structured comparison with these sections:

#### **Overview Table**
| Aspect | Target | Local | Gap |
|--------|--------|-------|-----|
| Total Files | count | count | +/- |
| Skills | count | count | +/- |
| Commands | count | count | +/- |
| Hooks | count | count | +/- |
| Agents | count | count | +/- |
| Tools | count | count | +/- |

#### **Detailed Gap Analysis**

For each category, identify:
- **Missing**: What target has that local lacks
- **Superior**: What local does better than target
- **Parity**: What's roughly equivalent

#### **Priority Recommendations**

Organize findings into priority tiers:

**HIGH Priority:**
- Security gaps (damage control, secret scanning)
- Automation gaps (hooks, auto-configuration)
- Critical workflow improvements

**MEDIUM Priority:**
- Quality validation improvements
- Additional commands or skills
- Cross-platform enhancements

**LOW Priority:**
- Nice-to-have features
- Documentation improvements
- UI/UX enhancements

### 4. Present Recommendations

Format the output as:

```markdown
## Comparison: [Target Repo] vs. Current Setup

### 📊 Overview
[Summary table]

### ✅ What's Better in Current Setup
- [List local advantages]

### ⚠️ Gaps Identified

#### **1. [Category Name]**
**Target has:** [Description]
**Recommendation:** [Actionable suggestion]
**Impact:** [Why this matters]

### 🎯 Priority Recommendations

#### HIGH Priority
1. [Item 1]
2. [Item 2]
...

#### MEDIUM Priority
1. [Item 1]
2. [Item 2]
...

#### LOW Priority
1. [Item 1]
2. [Item 2]
...

### 📝 Implementation Order
```
[Phased implementation plan]
```
```

### 5. Implementation Mode (Optional)

If `implement=true`:

Ask for confirmation before each phase:
- "Should I implement HIGH priority items? [Y/n]"
- After completion: "Should I implement MEDIUM priority items? [Y/n]"
- Continue until user declines or all items complete

### 6. Create Summary Todo

```
Phase 1 (HIGH): [List items]
Phase 2 (MEDIUM): [List items]
Phase 3 (LOW): [List items]
```

## Example Usage

```
/compare-setup https://github.com/ilude/dotfiles true
/compare-setup https://github.com/someuser/dotfiles false
```

## Best Practices

1. **Be objective**: Focus on structural/architectural differences, not subjective preferences
2. **Prioritize security**: Always flag security-related gaps as HIGH priority
3. **Context matters**: Consider the repo's stated purpose (dotfiles vs. project-specific)
4. **Implementation safety**: Never overwrite without reading existing files first
5. **Fail gracefully**: If target repo lacks .claude directory, report clearly

## Output Format

Always conclude with:
- Summary of total gaps found
- Estimated implementation complexity (Simple/Moderate/Complex)
- Recommended next steps based on user's goals
