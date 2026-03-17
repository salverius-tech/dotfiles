# makefile-workflow

Makefile best practices for project automation, build systems, and development workflow orchestration.

## Files

| File | Description |
|------|-------------|
| `knowledge.md` | Full Makefile workflow guidelines and patterns |

## Topics

- Target organization: PHONY vs file targets, dependency chains
- Variable management: immediate (`:=`), conditional (`?=`), recursive (`=`) assignment
- Platform detection and cross-OS compatibility
- Common development targets: install, test, lint, format, clean
- Docker integration and version-tagged image builds
- Output control: silent mode, colors, verbose/quiet toggles
- Error handling and command existence checks
