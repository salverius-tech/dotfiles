# Python Workflow Skill

Guidelines for Python projects covering package management (uv preferred), code style (PEP 8, Ruff), type safety, testing (pytest), configuration, CQRS patterns, and project structure.

## Files

| File           | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| `knowledge.md` | Portable Python workflow guidelines (loaded by agents)    |

## Topics Covered

- UV package manager (preferred) and alternatives (pip, poetry, pipenv)
- Virtual environment best practices (MUST use `uv run`, no manual .venv paths)
- PEP 8 compliance with Ruff formatting (88-char line length)
- Type hints and Pydantic data validation
- Naming conventions (PascalCase, snake_case, UPPER_SNAKE_CASE)
- Docstrings (PEP 257) and comment philosophy
- Error handling with specific exception types
- Project structure (src layout, imports, __init__.py)
- Configuration management (environment variables, Pydantic config)
- Testing strategy (pytest, fixtures, >80% coverage)
- CQRS command/query patterns
- Async/await patterns
