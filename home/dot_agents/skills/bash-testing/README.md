# bash-testing

Bash and shell script testing guidelines using the Bats-core (Bash Automated Testing System) framework, covering test structure, assertions, isolated environments, platform-specific tests, and CI integration.

## Files

| File | Purpose |
|------|---------|
| `knowledge.md` | Full Bats-core testing guidelines and patterns |

## Topics

- Test file structure with `setup()`, `teardown()`, and `@test` blocks
- Assertions for exit status, output matching, files, and content
- Isolated test environments using temporary `$HOME` directories
- Platform-specific tests with skip helpers for Windows/Linux/WSL
- Idempotency testing to verify scripts are safely re-runnable
- Makefile integration and GitHub Actions CI configuration
- `test_helper.bash` shared helper patterns
