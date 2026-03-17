---
name: session-context-management
description: Maintain "just enough" context across work sessions. Includes VS Code workspace detection for session identification.
---

Read `~/.agents/skills/session-context-management/knowledge.md` for the full guidelines. Note: the path is `~/.agents`, not `~/.claude`.

## Copilot-Specific: Instance/Session ID Detection

**Workspace Hash** (instance identifier):
1. Scan `%APPDATA%\Code\User\workspaceStorage\*\workspace.json`
2. Match `folder` field to current workspace
3. Use first 8 chars of directory hash as instance ID

**Session ID**: Use timestamp-based or sequential session identifier from VS Code's chat session storage.

## Copilot-Specific: Git Tracking Policy Check

In Activation Instructions step 1, check for `enable-session-commits: true` in project's `.github/copilot-instructions.md` or equivalent project configuration.
