# container-workflow

Guidelines for containerized projects using Docker, Dockerfile, docker-compose, and orchestration tools covering multi-stage builds, security, signal handling, entrypoint scripts, and deployment workflows.

## Files

| File | Description |
|------|-------------|
| `knowledge.md` | Full container workflow guidelines and patterns |

## Topics

- Docker Compose V2 syntax and DNS configuration
- Dockerfile best practices: multi-stage builds, layer optimization, Alpine base images
- Security: non-root users, secrets management, `no-new-privileges`
- 12-Factor App compliance and environment variable patterns
- Health checks, resource limits, and log rotation
- Signal handling and production entrypoint scripts
- BuildKit features and multi-platform builds
