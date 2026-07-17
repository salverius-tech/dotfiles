---
name: safe-repository-workflow
description: Inspect, modify, test, and review Git repositories without unintended commits or destructive changes. Use for repository work, reviews, branch operations, or release preparation.
---

# Safe Repository Workflow

## Inspect first

Run:

```bash
git status --short --branch
git diff --stat
git diff --check
git log -5 --oneline
```

Read the relevant project guidance, tests, manifests, and source before editing.
Use the repository's own package manager and verification commands.

## Make changes

Keep changes scoped to the request. Do not modify secrets, credentials, `.env`
files, SSH material, generated outputs, or dependency directories unless explicitly
requested and safely scoped. Use targeted edits and preserve existing conventions.

## Verify

Run the narrowest relevant tests first, then the canonical suite when practical.
Verify changed files and inspect the final diff. A passing subset does not prove the
whole repository is verified; state which scopes were actually checked.

## Git side effects

Do not commit, push, reset, clean, delete branches, or rewrite history unless the
user explicitly authorizes that action. When authorized, show the staged scope and
use a focused commit. Never claim a remote update without verifying the remote ref.
