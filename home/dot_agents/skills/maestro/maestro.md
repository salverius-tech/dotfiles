NOTE: This document is human-readable documentation only.
Agents must load maestro.json and must not ingest this file.

# Maestro Usage Skill

Use this skill when delegating work to the local Maestro execution server.

## Tool Registration Contract

See [CONTRACT.md](CONTRACT.md) for the authoritative interface contract that all Maestro tools must follow. See [README.md](README.md) for architecture overview and migration rules.

## Base URL and Auth

```text
Base URL: http://localhost:8100
Auth:     X-API-Key: <MAESTRO_API_KEY>
```

Adapters read `MAESTRO_BASE_URL`, `MAESTRO_API_KEY`, and `MAESTRO_CLIENT_TIMEOUT_MS` lazily at invocation time.

`GET /health` is public. Detailed health, metrics, capabilities, manifest, and tool endpoints require API-key auth by default unless the server explicitly exposes selected read-only endpoints publicly. Scoped keys are configured server-side with `MAESTRO_API_KEYS`; `/capabilities` is scope-aware and may omit tools the current key cannot use.

Maestro does not use `Authorization: Bearer`. Use `X-API-Key` when an API key is set.

## Contract Versioning

All versioned POST requests include this field in the JSON body:

```json
{ "contract_version": "1.0" }
```

GET and DELETE endpoints do not require `contract_version` unless a future route explicitly accepts a body.

## Response Envelopes

Most tool endpoints return:

```json
{
  "task_id": "<id>",
  "status": "completed",
  "result": {},
  "error": null,
  "execution_id": "<trace-id>"
}
```

HTTP 200 does not guarantee task success. Check `status`; treat `"failed"` as a tool failure. Some introspection/list endpoints return plain JSON shapes instead of the standard task envelope; adapters surface those unchanged.

## Dry-Run Mode

Dry-run-capable POST endpoints accept:

```json
{ "dry_run": true }
```

The response status is `"planned"` and no side effects are performed. Adapters may also synthesize a local planned envelope before calling the server.

## Endpoints Quick Reference

| Method | Path | Tool |
| --- | --- | --- |
| GET | `/health` | `maestro_health` |
| GET | `/health/detailed` | `maestro_health_detailed` |
| GET | `/capabilities` | `maestro_capabilities` |
| GET | `/manifest` | `maestro_manifest` |
| GET | `/metrics` | `maestro_metrics` |
| GET | `/metrics/prometheus` | `maestro_metrics_prometheus` |
| POST | `/run` | `maestro_run` |
| POST | `/llm` | `maestro_llm` |
| POST | `/embed` | `maestro_embed` |
| POST | `/rerank` | `maestro_rerank` |
| POST | `/text/chunk` | `maestro_text_chunk` |
| POST | `/pipeline` | `maestro_pipeline` |
| POST | `/vector/upsert` | `maestro_vector_upsert` |
| POST | `/vector/search` | `maestro_vector_search` |
| POST | `/vector/delete` | `maestro_vector_delete` |
| GET | `/vector/collections` | `maestro_vector_list_collections` |
| POST | `/vector/collections` | `maestro_vector_create_collection` |
| DELETE | `/vector/collections/{name}` | `maestro_vector_delete_collection` |
| POST | `/memory/put` | `maestro_memory_put` |
| POST | `/memory/get` | `maestro_memory_get` |
| POST | `/memory/search` | `maestro_memory_search` |
| POST | `/memory/list` | `maestro_memory_list` |
| POST | `/memory/delete` | `maestro_memory_delete` |
| POST | `/file/read` | `maestro_file_read` |
| POST | `/file/write` | `maestro_file_write` |
| POST | `/artifacts/put` | `maestro_artifact_put` |
| GET | `/artifacts` | `maestro_artifact_list` |
| GET | `/artifacts/{artifact_id}` | `maestro_artifact_get` |
| DELETE | `/artifacts/{artifact_id}` | `maestro_artifact_delete` |
| POST | `/artifacts/cleanup-expired` | `maestro_artifact_cleanup_expired` |
| GET | `/audit` | `maestro_audit_list` |
| POST | `/docker/run` | `maestro_docker_run` |
| GET | `/docker/{id}/status` | `maestro_docker_status` |
| GET | `/docker/{id}/logs` | `maestro_docker_logs` |
| POST | `/docker/{id}/exec` | `maestro_docker_exec` |
| POST | `/docker/{id}/stop` | `maestro_docker_stop` |
| DELETE | `/docker/{id}` | `maestro_docker_remove` |
| POST | `/tasks` | `maestro_tasks_submit` |
| GET | `/tasks` | `maestro_tasks_list` |
| GET | `/tasks/{task_id}` | `maestro_tasks_get` |
| GET | `/tasks/{task_id}/logs` | `maestro_tasks_logs` |
| POST | `/tasks/{task_id}/cancel` | `maestro_tasks_cancel` |
| POST | `/tasks/{task_id}/retry` | `maestro_tasks_retry` |
| DELETE | `/tasks/{task_id}` | `maestro_tasks_delete` |
| POST | `/tasks/cleanup` | `maestro_tasks_cleanup` |

## Common Payloads

### Rerank

```json
{
  "query": "local dev observability metrics",
  "documents": [
    { "id": "a", "text": "docker startup logs" },
    { "id": "b", "text": "prometheus metrics" }
  ],
  "top_k": 1
}
```

### Text chunk

```json
{
  "text": "alpha beta gamma delta",
  "strategy": "words",
  "chunk_size": 3,
  "overlap": 1
}
```

### Artifact put

```json
{
  "content": "Generated report body",
  "filename": "report.txt",
  "content_type": "text/plain",
  "metadata": { "kind": "report" },
  "ttl_seconds": 3600
}
```

### Managed async task

```json
{
  "tool": "rerank",
  "params": {
    "query": "metrics",
    "documents": [{ "text": "prometheus metrics" }]
  }
}
```

### Pipeline

Pipeline steps use action names such as `run`, `llm`, `embed`, `rerank`, `text.chunk`, `artifact.put`, `vector.search`, `memory.search`, `file_read`, and `file_write`. Step params can reference prior outputs:

```text
{{steps[N].result.key}}
```

Docker operations are standalone REST endpoints and are not pipeline actions.

## Server-Side Feature Flags

| Env var | Effect |
| --- | --- |
| `MAESTRO_ALLOW_SHELL` | Enables `/run` |
| `MAESTRO_ALLOW_DOCKER` | Enables `/docker/*` |
| `MAESTRO_ALLOW_MEMORY` | Enables `/memory/*` and memory pipeline actions |
| `MAESTRO_FILE_BASE_DIR` | Constrains file and artifact storage |
| `MAESTRO_PUBLIC_METRICS` | Allows public metrics when enabled |
| `MAESTRO_PUBLIC_DETAILED_HEALTH` | Allows public detailed health when enabled |

Adapters must not bypass server-side feature flags, scoped keys, rate limits, or file path constraints.
