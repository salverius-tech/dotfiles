# Maestro Skill

Deterministic local execution service for shell commands, LLM inference, embeddings, vector operations, planner-managed memory, file I/O, Docker operations, service introspection, and multi-step pipelines.

## Files

| File                      | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `maestro.json`            | Machine-readable tool registry (29 tools)                   |
| `maestro.md`              | Human-readable API documentation (not loaded by agents)     |
| `CONTRACT.md`             | Canonical interface contract (runtime-agnostic)             |
| `tests/validate-tools.sh` | HTTP validation suite for current Maestro endpoints         |

## Naming

Adapter tools use canonical names: prefix `maestro_` and replace dots from Maestro manifest names with underscores. Example: `vector.list_collections` → `maestro_vector_list_collections`.

## Tools (29)

| Tool | Endpoint | Description |
| --- | --- | --- |
| `maestro_health` | `GET /health` | Liveness check |
| `maestro_health_detailed` | `GET /health/detailed` | Detailed backend health |
| `maestro_capabilities` | `GET /capabilities` | Feature and backend capabilities |
| `maestro_manifest` | `GET /manifest` | Machine-readable tool manifest |
| `maestro_metrics` | `GET /metrics` | Runtime metrics JSON |
| `maestro_metrics_prometheus` | `GET /metrics/prometheus` | Prometheus/OpenMetrics text |
| `maestro_run` | `POST /run` | Execute shell command |
| `maestro_llm` | `POST /llm` | LLM inference |
| `maestro_embed` | `POST /embed` | Vector embeddings |
| `maestro_pipeline` | `POST /pipeline` | Multi-step workflow |
| `maestro_vector_upsert` | `POST /vector/upsert` | Insert/update vectors |
| `maestro_vector_search` | `POST /vector/search` | Search vectors |
| `maestro_vector_delete` | `POST /vector/delete` | Delete vectors |
| `maestro_vector_list_collections` | `GET /vector/collections` | List collections |
| `maestro_vector_create_collection` | `POST /vector/collections` | Create collection |
| `maestro_vector_delete_collection` | `DELETE /vector/collections/{name}` | Delete collection |
| `maestro_memory_put` | `POST /memory/put` | Store memory item |
| `maestro_memory_get` | `POST /memory/get` | Retrieve memory item |
| `maestro_memory_search` | `POST /memory/search` | Search memory |
| `maestro_memory_list` | `POST /memory/list` | List memory |
| `maestro_memory_delete` | `POST /memory/delete` | Delete memory item |
| `maestro_file_read` | `POST /file/read` | Read file |
| `maestro_file_write` | `POST /file/write` | Write file |
| `maestro_docker_run` | `POST /docker/run` | Run container |
| `maestro_docker_status` | `GET /docker/{id}/status` | Inspect container |
| `maestro_docker_logs` | `GET /docker/{id}/logs` | Fetch container logs |
| `maestro_docker_exec` | `POST /docker/{id}/exec` | Execute command in container |
| `maestro_docker_stop` | `POST /docker/{id}/stop` | Stop container |
| `maestro_docker_remove` | `DELETE /docker/{id}` | Remove container |

## Environment Variables

| Variable                    | Required | Default  | Description                    |
| --------------------------- | -------- | -------- | ------------------------------ |
| `MAESTRO_BASE_URL`          | Yes for calls | --       | Maestro server URL             |
| `MAESTRO_API_KEY`           | Server-dependent | --       | API key for `X-API-Key` header |
| `MAESTRO_CLIENT_TIMEOUT_MS` | No       | `310000` | Client-side request timeout    |

## Architecture

This skill defines the canonical, runtime-agnostic Maestro tool schemas and API documentation. Runtime-specific integrations are managed under `~/.agents/adapters/<runtime>/`.
