# Maestro Tool Contract — OpenCode Adapter

> Extends the canonical Maestro contract (`~/.agents/skills/maestro/CONTRACT.md`) with OpenCode-specific rules for the `@opencode-ai/plugin` runtime.

## Required API Shape

Every Maestro tool must use this structure:

```ts
import { tool } from "@opencode-ai/plugin";
const z = tool.schema;

export const maestro_<canonical_name> = tool({
  description: `<description>. Requires MAESTRO_BASE_URL. Set MAESTRO_API_KEY when the server requires authentication.`,
  args: {
    // Plain Zod fields (ZodRawShape). OpenCode wraps in z.object() internally.
  },
  async execute(args, _context) {
    // Env access is lazy inside getMaestroConfig()/callMaestro().
    return callMaestro("/endpoint", { body: args });
  },
});
```

## Naming

Use canonical adapter names only:

- `maestro_` prefix
- dots from Maestro manifest names replaced with underscores
- no legacy aliases

Examples:

- `vector.list_collections` → `maestro_vector_list_collections`
- `vector.create_collection` → `maestro_vector_create_collection`
- `vector.delete_collection` → `maestro_vector_delete_collection`
- `memory.put` → `maestro_memory_put`

The legacy `maestro_vector_collections_*` names must never be exported.

## Forbidden Patterns

These patterns must not appear in Maestro OpenCode tool files:

| Pattern | Reason |
| --- | --- |
| `handler:` or `handler(` | Legacy OpenCode API field |
| `inputSchema:` | Legacy OpenCode API field |
| `schema:` as a tool field | Legacy OpenCode API field |
| `argsSchema:` | Legacy OpenCode API field |
| default exports | Tools must be named exports |
| `process.env` outside `getMaestroConfig()` | Env access must be lazy |
| `args: z.object(` or `args: s.object(` | OpenCode wraps args internally |
| `maestro_vector_collections_` | Legacy non-canonical collection names |

## Environment Access

All env var reads must occur inside `getMaestroConfig()`, called lazily from tool execution.

`MAESTRO_BASE_URL` is required for calls. `MAESTRO_API_KEY` is optional at module load and should be sent as `X-API-Key` only when set.

## Contract Version Injection

`callMaestro()` injects `contract_version: "1.0"` into POST bodies. GET and DELETE requests do not need a body unless Maestro adds such a route in the future.

## Return Contract

OpenCode tools must return JSON strings. Do not return raw objects.

## Validation

Run before committing changes to `maestro.ts`:

```bash
~/.agents/adapters/opencode/maestro/check-contract.sh ~/.config/opencode/tools/maestro.ts
~/.agents/adapters/opencode/maestro/tests/check-schema-sync.sh
```
