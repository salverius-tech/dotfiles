# Maestro Skill

Deterministic local execution service for shell commands, LLM inference, embeddings, vector operations, file I/O, and multi-step pipelines.

## Architecture

Maestro uses a three-tier architecture:

```
skills/maestro/maestro.json          Canonical tool schemas (agent-agnostic)
        │
        ▼
roles/planner/tools/maestro.json     Role constraint overlay (advisory)
        │
        ▼
adapters/opencode/tools/maestro.json Adapter-specific reduced surface
        │
        ▼
~/.config/opencode/tools/maestro.ts  Runtime implementation (TypeScript + Zod)
```

| Layer                                         | Purpose                                            | Modified When                     |
| --------------------------------------------- | -------------------------------------------------- | --------------------------------- |
| **Skill** (`maestro.json` + `maestro.md`)     | Defines all tool schemas and API documentation     | New tool added or schema changed  |
| **Role** (`roles/*/tools/maestro.json`)       | Advisory constraints per role (e.g. dry-run only)  | Role permissions change           |
| **Adapter** (`adapters/*/tools/maestro.json`) | Runtime-specific glue, reduced surface             | Adapter needs different interface |
| **Runtime** (`maestro.ts`)                    | Actual tool implementation with Zod + OpenCode API | Tool behavior changes             |

## Files

| File                         | Purpose                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `maestro.json`               | Machine-readable tool registry (13 tools)               |
| `maestro.md`                 | Human-readable API documentation (not loaded by agents) |
| `CONTRACT.md`                | Authoritative interface contract — required API shape   |
| `check-contract.sh`          | Guardrail script — rejects forbidden patterns           |
| `tests/validate-tools.sh`    | Dry-run validation suite for all 13 tools               |
| `tests/check-schema-sync.sh` | Verifies maestro.json stays in sync with maestro.ts     |

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
| `MAESTRO_BASE_URL`          | Yes      | —        | Maestro server URL             |
| `MAESTRO_API_KEY`           | Yes      | —        | API key for `X-API-Key` header |
| `MAESTRO_CLIENT_TIMEOUT_MS` | No       | `310000` | Client-side request timeout    |

## Migration Rules

When adding or modifying tools, follow the contract in `CONTRACT.md`. Key rules:

- Use `tool({ description, args: { field: s.type() }, async execute() {...} })` from `@opencode-ai/plugin`
- Use `const s = tool.schema` for Zod types — do NOT `import { z } from "zod"`
- Do NOT wrap args in `z.object()` — `tool()` wraps internally; double-wrapping breaks runtime
- Named exports only — no default exports
- Env var access only inside `getMaestroConfig()` (lazy, inside `execute()`)
- `contract_version` is injected by `callMaestro()` — never set it in tool args
- `execute()` must return a JSON string, not an object
- Update `maestro.json` when adding/removing tools
- Run `check-contract.sh` and `tests/validate-tools.sh` before committing
