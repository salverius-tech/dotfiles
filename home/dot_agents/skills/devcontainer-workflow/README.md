# devcontainer-workflow

DevContainer configuration guidelines for consistent development environments with Docker, multi-stage builds, non-root users, environment management, Docker-in-Docker support, and Python with uv.

## Files

| File | Description |
|------|-------------|
| `knowledge.md` | Full DevContainer workflow guidelines and patterns |

## Topics

- Multi-stage Dockerfile patterns for development, testing, and production stages
- Non-root user (`vscode`) setup with proper permissions and sudo access
- Environment management with `.env` file strategy and layered overrides
- Docker-in-Docker configuration and security considerations
- Volume mounts for home directory persistence, SSH keys, and Docker socket
- Post-create commands with Makefile-driven initialization
- Python with uv patterns including dependency management and pyproject.toml
- Troubleshooting common DevContainer issues (permissions, extensions, mounts)
