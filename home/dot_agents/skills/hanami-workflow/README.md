# Hanami Workflow Skill

Guidelines for Hanami framework projects covering slices architecture, dependency injection (dry-system), ROM persistence, validation (dry-validation), actions, views, and testing patterns.

## Files

| File           | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| `knowledge.md` | Portable Hanami workflow guidelines (loaded by agents)   |

## Topics Covered

- Slices architecture (isolated containers, cross-slice communication)
- Dependency injection via Deps (dry-system)
- ROM persistence (entities, relations, repositories, changesets)
- Input validation with dry-validation contracts
- Single-purpose actions with contract integration
- Views, templates, and presenters
- Testing patterns (mocked actions, real-database repositories)
- Interactor/service pattern with Result objects
