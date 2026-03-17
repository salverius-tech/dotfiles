# Maestro Tool Contract

> This document defines the authoritative interface contract for all Maestro tools.
> Any tool that does not conform to this contract is invalid and must be fixed.

## Required API Shape (OpenCode Runtime)

Every Maestro tool **must** use this exact structure:

```ts
import { tool } from "@opencode-ai/plugin";

const z = tool.schema;

export const maestro_<name> = tool({
  description: `<description>. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.`,
  args: z.object({
    // Zod fields wrapped in z.object() — required for toJSONSchema conversion
  }),
  async execute(args, _context) {
    // All env var access via getMaestroConfig() — never at module scope
    // Must return a JSON string (not an object)
  },
});
```

## Required Fields

| Field         | Type                               | Notes                                          |
| ------------- | ---------------------------------- | ---------------------------------------------- |
| `description` | `string`                           | Must include env var requirement note          |
| `args`        | `z.ZodObject`                      | Zod fields wrapped in `z.object({})`           |
| `execute`     | `async (args, _context) => string` | Must return `JSON.stringify(...)`              |

## Forbidden Patterns

These patterns **must never appear** in Maestro tool files:

| Pattern                                    | Reason                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `handler:` or `handler(`                   | Legacy API field                                                         |
| `inputSchema:`                             | Legacy API field                                                         |
| `schema:` (as tool field)                  | Legacy API field                                                         |
| `argsSchema:`                              | Legacy API field                                                         |
| `jsonSchemaToZodShape`                     | JSON-schema conversion helper                                            |
| `zodForType`                               | JSON-schema conversion helper                                            |
| `JsonSchemaProp`                           | JSON-schema conversion helper                                            |
| `export default`                           | Must use named exports                                                   |
| `process.env` outside `getMaestroConfig()` | Env access must be lazy                                                  |
| `args: {` (without `z.object`)             | Args must be wrapped in `z.object()` for toJSONSchema compatibility      |

## Environment Variable Model

All environment variable reads **must** occur inside `getMaestroConfig()`, which is called
lazily within `execute()`. This ensures:

1. Module loading never fails due to missing env vars
2. Tool registration succeeds even without configuration
3. Env var changes are picked up at invocation time

Required env vars:
- `MAESTRO_BASE_URL` — Maestro server URL (e.g. `http://localhost:8100`)
- `MAESTRO_API_KEY` — API key for `X-API-Key` header
- `MAESTRO_CLIENT_TIMEOUT_MS` — Client timeout in milliseconds (default: `310000`)

## Contract Version

The `contract_version: "1.0"` field is injected automatically by `callMaestro()` into every
POST request body. Individual tools **must not** set `contract_version` in their args schema
or manually include it in request bodies.

## Return Value Contract

- All `execute()` functions must return a `string` (JSON-serialized)
- Use `JSON.stringify(data)` — never return raw objects, classes, or `undefined`
- No circular structures

## Dry-Run Support

Tools supporting dry-run **must** check `args.dry_run` before calling `callMaestro()` and
return a mock response:

```ts
if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
```

## Export Rules

- Every tool must be a **named export**: `export const maestro_<name> = tool({...})`
- No default exports
- No nested exports (e.g. `export const tools = { ... }`)
- One tool per export statement

## Schema Definition File (maestro.json)

The skill schema file `maestro.json` must stay synchronized with the TypeScript implementation.
It defines the machine-readable tool registry for agent planners and must include an entry for
every tool exported from `maestro.ts`.

## Validation

Run `check-contract.sh` to verify compliance. Run `tests/validate-tools.sh` to exercise
all tools via dry-run. Both must pass before changes are committed.
