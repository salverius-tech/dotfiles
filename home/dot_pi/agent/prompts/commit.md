---
description: Review changes and create a conventional commit when appropriate
argument-hint: "[push]"
---

Review the current git changes and create a clean conventional commit.

Steps:
1. Run `git status --short`.
2. Inspect relevant diffs before staging.
3. Group changes logically; do not mix unrelated work.
4. Check for secrets or accidentally generated files.
5. Stage only the intended files.
6. Commit with a conventional commit message.
7. Push only if `$1` is `push`.

Never commit credentials, API keys, tokens, or private machine-specific data.
