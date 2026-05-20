# Maestro Skill

Deterministic local execution service for shell commands, LLM inference, embeddings, reranking, text chunking, vector operations, planner-managed memory, file I/O, artifacts, audit events, managed async tasks, Docker operations, service introspection, and multi-step pipelines.

## Files

| File | Purpose |
| --- | --- |
| `maestro.json` | Machine-readable tool registry (45 tools) |
| `maestro.md` | Human-readable API documentation (not loaded by agents) |
| `CONTRACT.md` | Canonical interface contract (runtime-agnostic) |
| `tests/validate-tools.sh` | HTTP validation suite for current Maestro endpoints |

## Naming

Adapter tools use canonical names: prefix `maestro_` and replace dots from Maestro manifest names with underscores. Example: `vector.list_collections` → `maestro_vector_list_collections`.

## Tools (45)

| Tool | Endpoint | Description |
| --- | --- | --- |
| `maestro_health` | `GET /health` | Liveness check |
| `maestro_health_detailed` | `GET /health/detailed` | Detailed backend and state health |
| `maestro_capabilities` | `GET /capabilities` | Feature, auth, and backend capabilities |
| `maestro_manifest` | `GET /manifest` | Machine-readable tool manifest |
| `maestro_metrics` | `GET /metrics` | Runtime metrics JSON |
| `maestro_metrics_prometheus` | `GET /metrics/prometheus` | Prometheus/OpenMetrics text |
| `maestro_run` | `POST /run` | Execute shell command |
| `maestro_llm` | `POST /llm` | LLM inference |
| `maestro_embed` | `POST /embed` | Vector embeddings |
| `maestro_rerank` | `POST /rerank` | Deterministic lexical reranking |
| `maestro_text_chunk` | `POST /text/chunk` | Deterministic text chunking |
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
| `maestro_artifact_put` | `POST /artifacts/put` | Store text artifact |
| `maestro_artifact_list` | `GET /artifacts` | List artifact metadata |
| `maestro_artifact_get` | `GET /artifacts/{artifact_id}` | Retrieve artifact content |
| `maestro_artifact_delete` | `DELETE /artifacts/{artifact_id}` | Delete artifact |
| `maestro_artifact_cleanup_expired` | `POST /artifacts/cleanup-expired` | Delete expired artifacts |
| `maestro_audit_list` | `GET /audit` | List metadata-only audit events |
| `maestro_docker_run` | `POST /docker/run` | Run container |
| `maestro_docker_status` | `GET /docker/{id}/status` | Inspect container |
| `maestro_docker_logs` | `GET /docker/{id}/logs` | Fetch container logs |
| `maestro_docker_exec` | `POST /docker/{id}/exec` | Execute command in container |
| `maestro_docker_stop` | `POST /docker/{id}/stop` | Stop container |
| `maestro_docker_remove` | `DELETE /docker/{id}` | Remove container |
| `maestro_tasks_submit` | `POST /tasks` | Submit managed async task |
| `maestro_tasks_list` | `GET /tasks` | List managed tasks |
| `maestro_tasks_get` | `GET /tasks/{task_id}` | Retrieve task snapshot |
| `maestro_tasks_logs` | `GET /tasks/{task_id}/logs` | Retrieve task lifecycle logs |
| `maestro_tasks_cancel` | `POST /tasks/{task_id}/cancel` | Request task cancellation |
| `maestro_tasks_retry` | `POST /tasks/{task_id}/retry` | Retry task as a new task |
| `maestro_tasks_delete` | `DELETE /tasks/{task_id}` | Delete retained task |
| `maestro_tasks_cleanup` | `POST /tasks/cleanup` | Cleanup retained terminal tasks |

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MAESTRO_BASE_URL` | Yes for calls | -- | Maestro server URL |
| `MAESTRO_API_KEY` | Server-dependent | -- | API key for `X-API-Key` header |
| `MAESTRO_API_KEYS` | Server-side | -- | Scoped key map configured on the Maestro server |
| `MAESTRO_CLIENT_TIMEOUT_MS` | No | `310000` | Client-side request timeout |

`GET /health` is public. Detailed health, metrics, capabilities, manifest, and tool endpoints require API-key auth by default unless the server explicitly exposes selected read-only endpoints publicly.

## Validation Modes

Run the safe contract validation against a live Maestro server:

```bash
MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=<key> \
  ~/.agents/skills/maestro/tests/validate-tools.sh
```

Safe mode uses read-only endpoints and dry-run requests. To validate resource-backed path and destructive endpoints, allow the script to create disposable vector collections, artifacts, and tasks:

```bash
MAESTRO_VALIDATE_DESTRUCTIVE=true \
MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=<key> \
  ~/.agents/skills/maestro/tests/validate-tools.sh
```

Docker lifecycle validation is separately gated because it requires a reachable Docker daemon and a disposable container:

```bash
MAESTRO_VALIDATE_DOCKER=true \
MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=<key> \
  ~/.agents/skills/maestro/tests/validate-tools.sh
```

Use both flags to validate every resource-backed endpoint in one run when Docker is available.

## Architecture

This skill defines the canonical, runtime-agnostic Maestro tool schemas and API documentation. Runtime-specific integrations are managed under `~/.agents/adapters/<runtime>/`.
