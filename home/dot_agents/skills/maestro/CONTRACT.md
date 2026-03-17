# Maestro Tool Contract

> This document defines the canonical, runtime-agnostic interface contract for all Maestro tools.
> Any tool implementation that does not conform to this contract is invalid and must be fixed.

## Environment Variable Model

All environment variable reads **must** occur lazily at invocation time, not at module load.
This ensures:

1. Module loading never fails due to missing env vars
2. Tool registration succeeds even without configuration
3. Env var changes are picked up at invocation time

Required env vars:
- `MAESTRO_BASE_URL` — Maestro server URL (e.g. `http://localhost:8100`)
- `MAESTRO_API_KEY` — API key for `X-API-Key` header
- `MAESTRO_CLIENT_TIMEOUT_MS` — Client timeout in milliseconds (default: `310000`)

## Contract Version

Every POST request body **must** include `contract_version: "1.0"`. Requests without
`contract_version` are rejected with `422 Unprocessable Entity`.

GET and DELETE endpoints do not require `contract_version`.

**Current version:** `"1.0"`

## Return Value Contract

- All tool execute functions must return a JSON string (serialized)
- Never return raw objects, classes, or `undefined`
- No circular structures

## Dry-Run Support

Tools supporting dry-run **must** check a `dry_run` flag before performing side effects
and return a mock response with `"status": "planned"` when set.

## Export Rules

- Every tool must be a **named export**
- No default exports
- No nested exports (e.g. `export const tools = { ... }`)
- One tool per export statement

## Schema Definition File (maestro.json)

The canonical schema file `maestro.json` defines the machine-readable tool registry.
It must include an entry for every tool and stay synchronized with all runtime
implementations.

## Validation

Run `tests/validate-tools.sh` to exercise all tools against a live Maestro server.
This test suite is runtime-agnostic (pure HTTP) and must pass before changes are committed.

Runtime-specific adapters may provide additional validation scripts (e.g. contract
compliance checks, schema sync verification).
