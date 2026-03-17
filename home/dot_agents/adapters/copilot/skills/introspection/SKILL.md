---
name: introspection
description: "Meta-improvement patterns for analyzing interactions. Includes VS Code Copilot session storage access for interaction analysis."
---

Read `~/.agents/skills/introspection/knowledge.md` for the full guidelines. Note: the path is `~/.agents`, not `~/.claude`.

## Copilot-Specific: VS Code Session Storage

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
  "creationDate": 1770131457017,
  "lastMessageDate": 1770135987184,
  "requests": [
    {
      "timestamp": 1770131540436,
      "modelId": "copilot/claude-opus-4.5",
      "message": { "text": "user prompt" },
      "response": [
        { "value": "assistant text" },
        { "kind": "toolInvocationSerialized" },
        { "kind": "thinking" }
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
