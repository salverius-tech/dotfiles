---
description: Run the relevant test suite, diagnose failures, and fix them
argument-hint: "[focus]"
---

Run the relevant tests for this project and fix failures.

Focus: $ARGUMENTS

Steps:
1. Detect the project stack and test framework.
2. Read project guidance files and build/test configuration.
3. Run the smallest relevant test command first.
4. Diagnose failures before editing.
5. Make minimal fixes.
6. Re-run targeted tests.
7. Summarize what changed and any remaining risks.
