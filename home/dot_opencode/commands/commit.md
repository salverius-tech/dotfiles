---
description: Create logical git commits with optional push
argument-hint: push
---

# Opencode Commit Command

Create logical git commits with security scanning and optional push.

## Reference

**For detailed process, see:**
```
~/.claude/commands/commit.md
```

This command adapts the commit workflow for opencode.

## Process

1. Run `git status` to check uncommitted files
2. If working tree is clean or merge conflicts exist, exit with appropriate message
3. Check for git-crypt encrypted files (skip during security scanning)
4. Scan for secrets - STOP if any found
5. Categorize files: auto-ignore (*.log, *.db, etc.), auto-stage (source, config, tests), ask user (ambiguous)
6. Group by commit type: feat, fix, docs, test, refactor, perf, style, chore, build, ci, deps
7. Stage and commit each group with HEREDOC format
8. If `push` argument provided, run `git push` after commits

## Security Scanning

Look for these patterns:
- Secret files: .env, credentials.json, *.pem, *.key
- API keys: AKIA*, ghp_*, sk-ant-*, sk-*, API_KEY=, TOKEN=
- Private keys: -----BEGIN PRIVATE KEY-----
- Connection strings: mongodb://, postgres://, mysql://

If secrets found: STOP immediately, show details, suggest .gitignore.

## Commit Types

| Type | Purpose |
|------|---------|
| feat | New features |
| fix | Bug fixes |
| docs | Documentation |
| test | Tests |
| refactor | Code improvements |
| perf | Performance |
| style | Formatting |
| chore | Maintenance |
| build | Build system |
| ci | CI/CD |
| deps | Dependencies |

## Output

Show summary of created commits with hashes and messages.

## Push

If `$ARGUMENTS` contains "push", run `git push` after commits complete.
