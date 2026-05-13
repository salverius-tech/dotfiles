---
description: Create or update a project AGENTS.md with stack-specific Pi guidance
argument-hint: "[stack]"
---

Create or update this project's `AGENTS.md` with concise stack-specific guidance.

Requested stack focus: $ARGUMENTS

Steps:
1. Inspect repository files to detect the actual stack before editing.
2. Preserve existing project-specific instructions when updating an existing `AGENTS.md`.
3. Add only guidance that matches this repository.
4. Include relevant skills, preferred commands, generated paths to avoid, and testing commands.
5. Keep the file concise and useful for future Pi sessions.

Suggested skill mappings:
- C#/.NET: `csharp-workflow`, `testing-workflow`
- Blazor: `csharp-workflow`, `blazor-expert`, `playwright-blazor`, `testing-workflow`
- Python: `python-workflow`, `python-testing`, `testing-workflow`
- Android: `android-workflow`, `testing-workflow`, `security-first-design` for auth/signing/secrets

Do not add secrets, host-specific paths, or local credentials.
