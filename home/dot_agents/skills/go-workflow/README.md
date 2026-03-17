# Go Workflow Skill

Guidelines for working with Go projects covering modules, error handling, concurrency, testing, project structure, naming conventions, and CI/CD.

## Files

| File           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `knowledge.md` | Portable Go workflow guidelines (loaded by agents)  |

## Topics Covered

- Go modules management (go.mod, go.sum, dependency updates)
- Error handling patterns (wrapping, custom types, sentinel errors)
- Context propagation and cancellation
- Concurrency patterns (goroutines, channels, sync primitives)
- Table-driven testing, fixtures, race detection
- Project structure (cmd/, internal/, pkg/ layout)
- Naming conventions and interface design
- CI/CD requirements (build, test, lint, vulnerability scanning)
