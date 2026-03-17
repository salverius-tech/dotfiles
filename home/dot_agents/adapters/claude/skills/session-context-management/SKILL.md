---
name: session-context-management
description: Maintain "just enough" context across work sessions using CURRENT.md, STATUS.md, and LESSONS.md files. Activate when tasks take >15 minutes, touch 3+ files, interruptions likely, or scope uncertain.
---

**Auto-activate when:** Working with `CURRENT.md`, `STATUS.md`, `LESSONS.md`, `.session/` directory, or when user mentions /snapshot, /pickup, resume, session, or context management.

Read `~/.agents/skills/session-context-management/knowledge.md` for the full guidelines. Note: the path is `~/.agents`, not `~/.claude`.

## Claude-Specific: Instance/Session ID Detection

**Instance ID** (which IDE window):
```bash
INSTANCE_ID=$(cat ~/.claude/ide/$CLAUDE_CODE_SSE_PORT.lock 2>/dev/null | python -c "import json, sys; print(json.load(sys.stdin)['authToken'][:8])" 2>/dev/null || echo "unknown")
```

**Session ID** (which conversation):
```bash
SESSION_ID=$(ls -lt ~/.claude/debug/*.txt 2>/dev/null | head -1 | awk '{print $9}' | xargs basename 2>/dev/null | cut -d. -f1 | cut -c1-8 || echo "unknown")
```

**Combined Tag**: `[$INSTANCE_ID:$SESSION_ID]` (e.g., `[5d72a497:888cf413]`)

## Claude-Specific: Git Tracking Policy Check

In Activation Instructions step 1, the "project configuration file" is `.claude/CLAUDE.md`:
- Check: `test -f .claude/CLAUDE.md`
- Search for: `enable-session-commits: true` in `.claude/CLAUDE.md`
