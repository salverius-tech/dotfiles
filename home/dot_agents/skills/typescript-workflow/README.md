# TypeScript Workflow Skill

Guidelines for TypeScript/JavaScript projects using Bun as the primary package manager, covering module systems, type safety, Biome formatting, naming conventions, project structure, and error handling.

## Files

| File           | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `knowledge.md` | Portable TypeScript workflow guidelines (loaded by agents)      |

## Topics Covered

- Bun package manager (MUST use for all package/runtime operations)
- ESM/CommonJS module systems and tsconfig.json best practices
- Biome linting and formatting (preferred over ESLint/Prettier)
- Naming conventions (PascalCase, camelCase, UPPER_SNAKE_CASE)
- Type safety (no `any`, Zod validation, generics, Result types)
- Project structure and import patterns (path aliases)
- Error handling with custom error classes
- Async patterns and testing integration with Bun test
