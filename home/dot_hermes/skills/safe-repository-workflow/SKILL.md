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

## Research, plan, implement

Use this three-phase workflow for non-trivial changes, unfamiliar code, or work
where a wrong assumption is expensive:

1. **Research:** document the relevant files, symbols, callers, tests, constraints,
   and unknowns. Do not propose edits in the research artifact.
2. **Plan:** turn the approved understanding into scoped tasks, exact files,
   dependencies, success criteria, and risks.
3. **Implement:** follow the plan and report any discovery that invalidates the
   research instead of silently improvising.

For small, local, well-understood edits, keep the same inspection and verification
rules without creating unnecessary ceremony. Externalize multi-step plans and
intermediate findings in inspectable files so the work can survive context loss.

## Make changes

Keep changes scoped to the request. Do not modify secrets, credentials, `.env`
files, SSH material, generated outputs, or dependency directories unless explicitly
requested and safely scoped. Use targeted edits and preserve existing conventions.

When multiple agents or a human and an agent work concurrently, use a separate Git
worktree and branch for each worker. Integrate through review rather than sharing a
working directory or Git index.

## Verification loop

Treat verification as a loop, not a final claim:

1. Change the smallest useful scope.
2. Run the fastest meaningful test, linter, type check, or inspection.
3. Read the actual result and classify failures as code, test, environment, baseline,
   or scope problems.
4. Correct the cause and repeat with a bounded retry budget.

Escalate when the same failure makes no progress, when no credible oracle exists,
when the baseline is already failing, or when the change crosses into destructive,
shared, release, credential, or access-control scope. Never claim completion from a
command that was not run or a result that was not inspected.

## Verify

Run the narrowest relevant tests first, then the canonical suite when practical.
Verify changed files and inspect the final diff. A passing subset does not prove the
whole repository is verified; state which scopes were actually checked.
Report the exact files changed, commands run, observed results, remaining risks, and
unverified layers.

## Git side effects

Do not commit, push, reset, clean, delete branches, or rewrite history unless the
user explicitly authorizes that action. When authorized, show the staged scope and
use a focused commit. Never claim a remote update without verifying the remote ref.
