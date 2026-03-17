# Maestro Skill

Deterministic local execution service for shell commands, LLM inference, embeddings, vector operations, file I/O, and multi-step pipelines.

## Files

| File                      | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `maestro.json`            | Machine-readable tool registry (13 tools)                   |
| `maestro.md`              | Human-readable API documentation (not loaded by agents)     |
| `CONTRACT.md`             | Canonical interface contract (runtime-agnostic)             |
| `tests/validate-tools.sh` | HTTP validation suite for all 13 tools (runtime-agnostic)   |

## Tools (13)

| Tool                                | Endpoint                            | Description           |
| ----------------------------------- | ----------------------------------- | --------------------- |
| `maestro_run`                       | `POST /run`                         | Execute shell command |
| `maestro_pipeline`                  | `POST /pipeline`                    | Multi-step workflow   |
| `maestro_llm`                       | `POST /llm`                         | LLM inference         |
| `maestro_embed`                     | `POST /embed`                       | Vector embeddings     |
| `maestro_vector_upsert`             | `POST /vector/upsert`               | Insert/update vectors |
| `maestro_vector_search`             | `POST /vector/search`               | Search vectors        |
| `maestro_vector_delete`             | `POST /vector/delete`               | Delete vectors        |
| `maestro_file_read`                 | `POST /file/read`                   | Read file             |
| `maestro_file_write`                | `POST /file/write`                  | Write file            |
| `maestro_health`                    | `GET /health`                       | Health check          |
| `maestro_vector_collections_list`   | `GET /vector/collections`           | List collections      |
| `maestro_vector_collections_create` | `POST /vector/collections`          | Create collection     |
| `maestro_vector_collections_delete` | `DELETE /vector/collections/{name}` | Delete collection     |

## Environment Variables

| Variable                    | Required | Default  | Description                    |
| --------------------------- | -------- | -------- | ------------------------------ |
| `MAESTRO_BASE_URL`          | Yes      | --       | Maestro server URL             |
| `MAESTRO_API_KEY`           | Yes      | --       | API key for `X-API-Key` header |
| `MAESTRO_CLIENT_TIMEOUT_MS` | No       | `310000` | Client-side request timeout    |

## Architecture

This skill defines the canonical, runtime-agnostic Maestro tool schemas and API documentation.
Runtime-specific adapters (e.g. for OpenCode, Claude, Copilot) live in `~/.agents/adapters/`
and are responsible for mapping these schemas to their respective tool APIs.

```
skills/maestro/
├── maestro.json       Canonical tool schemas (agent-agnostic)
├── maestro.md         API documentation
├── CONTRACT.md        Interface contract
└── tests/
    └── validate-tools.sh   HTTP validation (runtime-agnostic)
```
