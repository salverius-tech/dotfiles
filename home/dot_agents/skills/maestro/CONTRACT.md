# Maestro Tool Contract

> Canonical, runtime-agnostic interface contract for Maestro tool adapters.

**Tool contract document version:** 1.2
**Current request `contract_version`:** `"1.0"`

## Source of Truth

The current server API lives in the Maestro repository:

- `C:\dev\maestro\docs\tool-contract.md`
- `C:\dev\maestro\docs\openapi.json`
- `C:\dev\maestro\src\executor\app\routes\*_routes.py`
- `C:\dev\maestro\src\executor\app\schemas\task_*.py`

This directory's `maestro.json` is the canonical dotfiles-side registry that adapters sync against.

## Environment Variable Model

All environment variable reads **must** occur lazily at invocation time, not at module load.
This ensures:

1. Module loading never fails due to missing env vars
2. Tool registration succeeds even without configuration
3. Env var changes are picked up at invocation time

Environment variables:

- `MAESTRO_BASE_URL` — Maestro server URL, e.g. `http://localhost:8100` (**required for calls**)
- `MAESTRO_API_KEY` — API key sent as `X-API-Key` when set
- `MAESTRO_CLIENT_TIMEOUT_MS` — client timeout in milliseconds, default `310000`

Current Maestro rejects anonymous access to authenticated endpoints by default unless the server is explicitly configured with `MAESTRO_ALLOW_ANONYMOUS_AUTH=true`. Adapters should allow `MAESTRO_API_KEY` to be absent at registration time, and include `X-API-Key` only when present.

## Contract Version

Every POST request body to endpoints backed by a `ToolRequest` must include:

```json
{ "contract_version": "1.0" }
```

Read-only GET endpoints and DELETE endpoints do not require `contract_version` unless the server route explicitly accepts a body.

## Tool Naming

Adapters must use canonical names derived from Maestro manifest names:

1. Prefix with `maestro_`
2. Replace dots with underscores
3. Do not use legacy aliases

Examples:

| Manifest name | Adapter tool name |
| --- | --- |
| `vector.list_collections` | `maestro_vector_list_collections` |
| `vector.create_collection` | `maestro_vector_create_collection` |
| `vector.delete_collection` | `maestro_vector_delete_collection` |
| `memory.put` | `maestro_memory_put` |

Legacy names such as `maestro_vector_collections_list` are invalid.

## Current Tool Surface

The canonical registry contains these tools:

- Service: `health`, `health_detailed`, `capabilities`, `manifest`, `metrics`, `metrics_prometheus`
- Execution: `run`, `llm`, `embed`, `pipeline`
- Vector: `vector.upsert`, `vector.search`, `vector.delete`, `vector.list_collections`, `vector.create_collection`, `vector.delete_collection`
- Memory: `memory.put`, `memory.get`, `memory.search`, `memory.list`, `memory.delete`
- File: `file_read`, `file_write`
- Docker: `docker_run`, `docker_status`, `docker_logs`, `docker_exec`, `docker_stop`, `docker_remove`

## Return Value Contract

Runtime adapters must return values in their host runtime's required tool-result shape:

- OpenCode adapter: JSON string
- Pi adapter: Pi `ToolResult` object with `content` and `details`

Adapters must surface Maestro envelopes without losing `task_id`, `status`, `result`, `error`, or `execution_id`.

## Failure Handling

- Non-2xx HTTP responses must throw/report tool failure.
- Maestro envelope responses with `status: "failed"` must throw/report tool failure even when HTTP status is 200.
- Error messages should include `task_id`, `execution_id`, and `error` when available.

## Dry-Run Support

Tools supporting dry-run must check `dry_run` before performing side effects when adapter-side dry-run is implemented. The mock response must use a Maestro-like envelope:

```json
{
  "task_id": "dry-run",
  "status": "planned",
  "result": { "tool": "run", "params": {} },
  "error": null
}
```

## Feature Flags

Certain endpoints require server-side feature flags:

- Shell: `MAESTRO_ALLOW_SHELL=true`
- Docker: `MAESTRO_ALLOW_DOCKER=true`
- Memory: `MAESTRO_ALLOW_MEMORY=true`
- File operations are constrained by `MAESTRO_FILE_BASE_DIR`

Adapters must not bypass these controls. Role constraints such as `allow_shell: false` are advisory for planners; enforcement is server-side.

## Schema Definition File

`maestro.json` defines the machine-readable tool registry. It must include every supported tool and stay synchronized with runtime implementations.

## Validation

Runtime-specific adapters provide additional validation scripts, including contract compliance checks and schema sync checks. The runtime-agnostic live validation should exercise tools against a running Maestro server when available.
