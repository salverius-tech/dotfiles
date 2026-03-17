# Git Workflow Skill

Comprehensive git workflow principles covering security scanning, conventional commits, push safety, destructive operation guardrails, and PR CI check analysis.

## Files

| File           | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `knowledge.md` | Portable git workflow guidelines (loaded by agents)   |

## Topics Covered

- Secret scanning (AWS, GitHub, Anthropic, OpenAI, generic patterns)
- Git-crypt exception handling
- Conventional commit types and atomic commit principles
- HEREDOC commit message format
- Push behavior rules (explicit keyword required)
- Force push avoidance
- Destructive operation bans (filter-branch, gc --prune=now, reset --hard)
- History rewrite guidance (git-filter-repo)
- PR CI check analysis (gh pr checks --required)
- Auto-merge prerequisites (branch protection rules)
