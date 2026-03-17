# FastAPI Workflow Skill

Guidelines for FastAPI projects covering project structure, dependency injection, Pydantic validation, async database access, router organization, testing, middleware, and security patterns.

## Files

| File           | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `knowledge.md` | Portable FastAPI workflow guidelines (loaded by agents)     |

## Topics Covered

- Project structure and router organization (domain-based with prefixes/tags)
- Dependency injection with `Depends()` (DB sessions, auth, config, services)
- Pydantic validation and BaseSettings configuration
- Async database access with SQLAlchemy 2.0+ (asyncpg, aiosqlite)
- Exception handling with custom domain errors and HTTPException
- Testing with httpx AsyncClient and dependency overrides
- Middleware patterns (CORS, timing) and background tasks
- Security patterns (OAuth2, JWT token validation)
