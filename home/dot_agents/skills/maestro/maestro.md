NOTE: This document is human-readable documentation only.
Agents must load maestro.json and must not ingest this file.

# Maestro Usage Skill

Use this skill when delegating work to the local Maestro execution server.

## Base URL and Auth

```
Base URL:  http://localhost:8100
Auth:      X-API-Key: <MAESTRO_API_KEY>
```

**Every request must include this header — no exceptions:**

```
X-API-Key: <MAESTRO_API_KEY>
```

Maestro does NOT use `Authorization: Bearer`. It does NOT use `/v1/...` OpenAI-compatible paths for `/llm` or `/embed`. Use the paths and auth scheme documented here exactly.

---

## Contract Versioning

All POST requests **require** a `contract_version` field in the JSON body:

```json
{
  "contract_version": "1.0",
  "command": "echo hello"
}
```

Requests without `contract_version` are rejected with `422 Unprocessable Entity`. Requests with an unsupported version get a clear error listing supported versions.

**Current version:** `"1.0"`

GET endpoints (`/health`, `/metrics`, `/capabilities`, `/manifest`) do not require `contract_version`.

---

## Server-Side Feature Flags

| Env var                         | Default    | Effect                                                              |
| ------------------------------- | ---------- | ------------------------------------------------------------------- |
| `MAESTRO_ALLOW_SHELL`           | `false`    | Enables `/run` — **disabled by default for security**               |
| `MAESTRO_ALLOW_DOCKER`          | `false`    | Enables `/docker/*` — **disabled by default for security**          |
| `MAESTRO_AUTO_PULL_MODELS`      | `false`    | Pulls missing Ollama models on first use                            |
| `MAESTRO_PULL_TIMEOUT_SECONDS`  | `600`      | Seconds before a pull is abandoned                                  |
| `MAESTRO_INFER_TIMEOUT_SECONDS` | `300`      | Seconds before an LLM generate call times out (0 = no timeout)      |
| `MAESTRO_FILE_MAX_BYTES`        | `10485760` | Max bytes for a single `/file/write` (0 = unlimited)                |
| `MAESTRO_CORS_ORIGINS`          | `*`        | Comma-separated allowed CORS origins                                |
| `MAESTRO_MAX_EXECUTION_SECONDS` | `0`        | Global cap on task execution time (0 = no cap, use request timeout) |
| `MAESTRO_MAX_CONCURRENT_TASKS`  | `0`        | Max concurrent tasks across all endpoints (0 = unlimited)           |

> **Security Note:** Shell and Docker execution are disabled by default. Set `MAESTRO_ALLOW_SHELL=true`
> and/or `MAESTRO_ALLOW_DOCKER=true` only in trusted environments.

---

## Response Envelope

Every endpoint returns:

```json
{
  "task_id": "<12-char hex>",
  "status": "completed" | "failed" | "pending" | "running" | "planned",
  "result": { ... },
  "error": null | "<message>",
  "execution_id": "<32-char hex>"
}
```

**HTTP 200 does NOT mean success.** Always check `status` in the response body. A successful HTTP
200 response may still have `"status": "failed"` if the task itself failed. Treat any response
where `status != "completed"` as an error.

The `"planned"` status is returned when `dry_run: true` — no side effects were executed.

Every response also includes an `X-Execution-ID` header for distributed tracing.

---

## Dry-Run Mode

All POST execution endpoints support `"dry_run": true`. When set, Maestro returns the execution
plan without performing any side effects:

```json
{
  "contract_version": "1.0",
  "command": "rm -rf /tmp/data",
  "dry_run": true
}
```

Response has `"status": "planned"` and `result` contains the execution parameters that would
have been used. Use this to validate plans before executing them.

---

## Endpoints Quick Reference

| Method | Path                       | Purpose                                         | Auth |
| ------ | -------------------------- | ----------------------------------------------- | ---- |
| GET    | /health                    | Liveness probe                                  | No   |
| GET    | /health/detailed           | Backend connectivity status                     | No   |
| GET    | /metrics                   | Runtime counters (JSON)                         | No   |
| GET    | /metrics/prometheus        | Prometheus / OpenMetrics format                 | No   |
| GET    | /capabilities              | Available tools, backends, features             | No   |
| GET    | /manifest                  | Machine-readable tool definitions (JSON Schema) | No   |
| POST   | /run                       | Execute shell command                           | Yes  |
| POST   | /run?stream=true           | Execute with SSE streaming                      | Yes  |
| POST   | /llm                       | Local LLM inference                             | Yes  |
| POST   | /embed                     | Vector embeddings                               | Yes  |
| POST   | /vector/upsert             | Upsert points into a vector collection          | Yes  |
| POST   | /vector/search             | Search a vector collection                      | Yes  |
| POST   | /vector/delete             | Delete points from a vector collection          | Yes  |
| GET    | /vector/collections        | List all collections                            | Yes  |
| POST   | /vector/collections        | Create a collection                             | Yes  |
| DELETE | /vector/collections/{name} | Delete a collection                             | Yes  |
| POST   | /file/read                 | Read file from base dir                         | Yes  |
| POST   | /file/write                | Write file to base dir                          | Yes  |
| POST   | /pipeline                  | Multi-step workflow                             | Yes  |
| POST   | /docker/run                | Run a container                                 | Yes  |
| GET    | /docker/{id}/status        | Container status                                | Yes  |
| GET    | /docker/{id}/logs?tail=N   | Container logs                                  | Yes  |
| POST   | /docker/{id}/exec          | Exec command in container                       | Yes  |
| POST   | /docker/{id}/stop          | Stop container                                  | Yes  |
| DELETE | /docker/{id}               | Remove container                                | Yes  |

---

## Endpoint Details

### POST /run

```json
{
  "contract_version": "1.0",
  "command": "ls -la /app",
  "timeout": 30,
  "workdir": null,
  "callback_url": null
}
```

Result: `{ "stdout": "...", "stderr": "...", "returncode": 0 }`

Requires `MAESTRO_ALLOW_SHELL=true` on the server.

**Streaming:** Pass `?stream=true` query parameter to receive Server-Sent Events with stdout/stderr
lines as they are produced. The stream ends with `data: [DONE]`.

```
data: {"event": "output", "channel": "stdout", "data": "line 1\n"}
data: {"event": "output", "channel": "stderr", "data": "warning\n"}
data: {"event": "result", "task_id": "abc123", "status": "completed", "returncode": 0}
data: [DONE]
```

---

### POST /llm

```json
{
  "contract_version": "1.0",
  "model": "llama3.1:8b",
  "prompt": "...",
  "system": null,
  "temperature": 0.7,
  "max_tokens": 1024,
  "backend": null,
  "quantization": null
}
```

Result: `{ "text": "...", "model": "llama3.1:8b", "backend": "ollama-llm" }`

`system` is an optional instruction string prepended before the user prompt. Use it to constrain
output format or persona — e.g. `"You are a concise assistant. Respond in one sentence."` or
`"Return only valid JSON."`. Leave `null` if no special instruction is needed.

Available models (local defaults): `maestro-assistant:latest`, `llama3.1:8b`

To target a specific backend, set `backend` to the backend ID (e.g. `"ollama-llm"`, `"openrouter"`).
When omitted, Maestro selects the best available LLM backend automatically.

---

### POST /embed

```json
{
  "contract_version": "1.0",
  "input": "text to embed",
  "model": "nomic-embed-text"
}
```

`input` can be a string or a list of strings.

Result: `{ "embeddings": [[...]], "model": "nomic-embed-text", "backend": "ollama-embed" }`

Available embedding model: `nomic-embed-text` (768-dim). Maestro auto-selects the best
available embed backend. There is no `backend` field on embed requests.

---

### POST /vector/upsert

```json
{
  "contract_version": "1.0",
  "collection": "my_collection",
  "points": [
    { "id": 1, "vector": [0.1, 0.2, ...], "payload": { "text": "hello" } }
  ],
  "backend": null
}
```

Result: `{ "operation": "upsert", "collection": "my_collection", "backend": "qdrant" }`

---

### POST /vector/search

```json
{
  "contract_version": "1.0",
  "collection": "my_collection",
  "vector": [0.1, 0.2, ...],
  "limit": 10,
  "filter": {},
  "with_payload": true,
  "with_vectors": false,
  "backend": null
}
```

Result: `{ "operation": "search", "collection": "my_collection", "backend": "qdrant" }`

Also accessible via `/vector/query` (hidden alias for `/vector/search`).

---

### POST /vector/delete

```json
{
  "contract_version": "1.0",
  "collection": "my_collection",
  "ids": [1, 2, 3],
  "backend": null
}
```

Result: `{ "operation": "delete", "collection": "my_collection", "backend": "qdrant" }`

---

### GET /vector/collections

No request body. Optional query param `?backend=qdrant` to target a specific backend.

Result: `{ "operation": "list_collections", "collections": ["docs", "images"], "backend": "qdrant" }`

---

### POST /vector/collections

```json
{
  "contract_version": "1.0",
  "name": "my_collection",
  "vector_size": 768,
  "distance": "cosine",
  "if_not_exists": false,
  "options": {},
  "backend": null
}
```

Result: `{ "operation": "create_collection", "name": "my_collection", "created": true, "backend": "qdrant" }`

`distance` options: `cosine`, `euclid`, `dot`, `manhattan`. Default: `cosine`.
`if_not_exists`: when `true`, returns `"created": false` if collection already exists instead of erroring.

---

### DELETE /vector/collections/{name}

No request body. Collection name is in the URL path.

Result: `{ "operation": "delete_collection", "name": "my_collection", "backend": "qdrant" }`

---

### GET /health/detailed

No auth required. Returns backend connectivity and model registry state.

```json
{
  "status": "ok" | "degraded",
  "service": "maestro-executor",
  "version": "0.1.0",
  "backends": {
    "ollama-llm":   { "status": "connected", "models": 3 },
    "ollama-embed": { "status": "connected" },
    "openrouter":   { "status": "connected" },
    "qdrant":       { "status": "connected" }
  },
  "models": {
    "registered": 3,
    "list": ["llama3.1:8b", "nomic-embed-text", ...]
  },
  "config_generation": 1,
  "last_reload_error": null
}
```

`status` is `"degraded"` if any required backend is unreachable. Optional backends (like
`openrouter` or `qdrant`) show as `"disconnected (optional)"` without affecting overall status.
`config_generation` increments on each backends.yaml hot-reload; `last_reload_error` is
non-null when the most recent reload failed.

---

### GET /capabilities

No auth required. Returns available tools, backends, and feature flags.

```json
{
  "tools": [
    "run",
    "llm",
    "embed",
    "vector.upsert",
    "vector.search",
    "vector.delete",
    "pipeline",
    "file_read",
    "file_write",
    "docker_run",
    "docker_exec"
  ],
  "backends": ["ollama-llm", "ollama-embed", "openrouter", "qdrant"],
  "backend_capabilities": {
    "ollama-llm": ["discovery", "generate", "health", "stream"],
    "ollama-embed": ["embed", "health"],
    "openrouter": ["discovery", "generate", "health", "stream"],
    "qdrant": ["health", "vector.delete", "vector.search", "vector.upsert"]
  },
  "backend_contracts": {
    "ollama-llm": { "contract_type": "llm", "profile": "default", "adapter": "ollama" },
    "ollama-embed": { "contract_type": "embed", "profile": "default", "adapter": "ollama" },
    "openrouter": { "contract_type": "llm", "profile": "cloud", "adapter": "openai_compatible" },
    "qdrant": { "contract_type": "vector", "profile": "default", "adapter": "qdrant" }
  },
  "features": {
    "shell_enabled": true,
    "docker_enabled": false,
    "auto_pull_models": false,
    "dry_run": true
  },
  "contract_versions": ["1.0"]
}
```

Use this to discover what Maestro supports before constructing a plan.
`backend_contracts` shows each backend's contract type (llm/embed/vector), profile, and adapter.

---

### GET /manifest

No auth required. Machine-readable tool definitions with JSON Schema inputs.

```json
{
  "version": "0.1.0",
  "contract_version": "1.0",
  "tools": [
    {
      "name": "run",
      "description": "Execute a shell command or script and return stdout/stderr.",
      "input_schema": { "properties": { "command": { "type": "string" }, "...": "..." } }
    }
  ]
}
```

Planners and tool registries can consume this to auto-discover tools and their input schemas.

---

### POST /file/read

```json
{
  "contract_version": "1.0",
  "path": "relative/path/to/file.txt"
}
```

Paths are relative to `MAESTRO_FILE_BASE_DIR`. Path traversal is rejected.

Result: `{ "path": "...", "content": "..." }`

---

### POST /file/write

```json
{
  "contract_version": "1.0",
  "path": "output/result.txt",
  "content": "...",
  "mode": "overwrite"
}
```

`mode`: `"overwrite"` (default) or `"append"`. Parent dirs created automatically.

Result: `{ "path": "...", "bytes_written": N }`

---

### POST /pipeline

Run multiple actions in sequence with optional output chaining between steps.

**When to use pipeline vs standalone:**

- Use `/pipeline` when you need 2+ steps where one step's output feeds the next (shell → LLM, LLM → file, etc.).
- Use standalone endpoints (`/run`, `/llm`, etc.) for single, independent operations.

```json
{
  "contract_version": "1.0",
  "steps": [
    { "action": "<action>", "params": { ... } },
    { "action": "<action>", "params": { ... } }
  ],
  "stop_on_error": true,
  "callback_url": null
}
```

**Available actions:** `run`, `llm`, `embed`, `vector.upsert`, `vector.search`, `vector.delete`, `file_read`, `file_write`

Each action accepts the same params as its standalone endpoint.

**Pipeline response:**

```json
{
  "task_id": "...",
  "status": "completed",
  "steps": [
    { "step_index": 0, "action": "run", "status": "completed", "result": {...}, "error": null },
    { "step_index": 1, "action": "llm", "status": "completed", "result": {...}, "error": null }
  ]
}
```

---

## Step Output Chaining

Reference a prior step's result inside any param value:

```
{{steps[N].result.key.subkey}}
```

- `N` is the zero-based step index.
- `key.subkey` is a dot-delimited path into that step's `result` object.
- Full-string placeholder → resolved value keeps its original type.
- Inline placeholder (embedded in a larger string) → converted to string.

**Example — shell output → file write (most common pattern):**

```json
{
  "contract_version": "1.0",
  "steps": [
    {
      "action": "run",
      "params": { "contract_version": "1.0", "command": "ls -la /app" }
    },
    {
      "action": "file_write",
      "params": {
        "contract_version": "1.0",
        "path": "output/listing.txt",
        "content": "{{steps[0].result.stdout}}"
      }
    }
  ]
}
```

**Example — LLM output → file write:**

```json
{
  "contract_version": "1.0",
  "steps": [
    {
      "action": "llm",
      "params": {
        "contract_version": "1.0",
        "model": "maestro-assistant:latest",
        "prompt": "Summarise the key points of async/await in Python."
      }
    },
    {
      "action": "file_write",
      "params": {
        "contract_version": "1.0",
        "path": "notes/async.txt",
        "content": "{{steps[0].result.text}}"
      }
    }
  ]
}
```

**Example — shell output → LLM prompt (inline):**

```json
{
  "contract_version": "1.0",
  "steps": [
    {
      "action": "run",
      "params": { "contract_version": "1.0", "command": "cat /data/report.txt" }
    },
    {
      "action": "llm",
      "params": {
        "contract_version": "1.0",
        "model": "llama3.1:8b",
        "prompt": "Summarise this report:\n\n{{steps[0].result.stdout}}"
      }
    }
  ]
}
```

---

## Error Handling Rules

- Always check `status == "failed"` before using `result`.
- `error` contains a human-readable message when `status == "failed"`.
- For `/pipeline`, check each step's `status` individually.
- `"Ref resolution failed: ..."` means a `{{steps[N].result.key}}` placeholder could not be resolved (bad index or missing key).
- HTTP errors (401, 503) indicate auth failure or backend unavailability — these are transport-level and return non-JSON bodies.

---

## Webhooks

Add `"callback_url": "http://..."` to any mutating request. Maestro will POST the full response envelope to that URL after completion. Fire-and-forget; delivery is not guaranteed.

---

## Startup Behavior

When Maestro starts without `MAESTRO_API_KEY` configured, it logs a warning:

```
WARNING: MAESTRO_API_KEY is not set — authentication is DISABLED. This is insecure for production environments.
```

This makes it obvious when the service is running with auth bypassed.

---

## Metrics

`GET /metrics` returns runtime counters as JSON. `GET /metrics/prometheus` returns the same data
in Prometheus text exposition format. All counters increment from 0 on startup.

Key counters:

- `requests_total` — all HTTP requests
- `run_total` / `run_failed` — shell execution
- `llm_total` / `llm_failed` — LLM inference
- `embed_total` / `embed_failed` — embedding generation
- `docker_total` / `docker_failed` — Docker container operations
- `pipeline_total` / `pipeline_failed` — pipeline executions
- `rate_limited_total` — requests blocked by rate limiting
- `backend_selected_total` — backend selection frequency (generic, all backends)
- `config_reload_total` / `config_reload_failed` — backends.yaml hot-reload events
- `failure_timeout` / `failure_invalid_input` / `failure_backend_error` — failure classification
- `dry_run_total` — dry-run requests
