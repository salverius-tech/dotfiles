---
name: git-workflow
description: Git workflow and commit guidelines. Trigger keywords: git, commit, push, .git, version control. MUST be activated before ANY git commit, push, or version control operation. Includes security scanning for secrets (API keys, tokens, .env files), commit message formatting with HEREDOC, logical commit grouping (docs, test, feat, fix, refactor, chore, build, deps), push behavior rules, safety rules for hooks and force pushes, CRITICAL safeguards for destructive operations (filter-branch, gc --prune, reset --hard), PR CI check analysis (gh pr checks, required vs non-blocking), and auto-merge limitations. Activate when user requests committing changes, pushing code, creating commits, rewriting history, or performing any git operations including analyzing uncommitted changes.
---

**Auto-activate when:** Working with `.gitignore`, `.gitattributes`, `.git/`, or when user mentions commit, push, git, version control, pull request, branch, merge, staging changes, filter-branch, rebase, reset, or history rewrite. Should also activate when bash commands contain `git` (requires conversation parsing).

Read `~/.agents/skills/git-workflow/knowledge.md` for the full guidelines.

## Philosophy

This skill defines the principles. The `/commit` command implements the procedural execution. Security always comes first, commits require explicit request, and pushes require the "push" keyword.
