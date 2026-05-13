# Maestro Tool Contract — Pi Adapter

> Extends the canonical Maestro contract (`~/.agents/skills/maestro/CONTRACT.md`) with Pi-specific rules for TypeScript extensions.

## Runtime Shape

The Pi adapter implementation lives at:

```text
~/.agents/adapters/pi/extensions/maestro.ts
```

It is loaded by Pi through `~/.pi/agent/settings.json` because the global settings include:

```json
"extensions": ["~/.agents/adapters/pi/extensions"]
```

## Required API Shape

Every Maestro tool must be registered with `pi.registerTool()`:

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function maestroExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "maestro_<canonical_name>",
    label: "Maestro ...",
    description: "... Requires MAESTRO_BASE_URL. Set MAESTRO_API_KEY when the server requires authentication.",
    parameters: Type.Object({}),
    async execute(_toolCallId, params, signal) {
      const data = await callMaestro("/endpoint", { body: params, signal });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        details: data,
      };
    },
  });
}
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

The legacy `maestro_vector_collections_*` names must never be registered.

## Environment Access

All environment variable reads must occur lazily inside `getMaestroConfig()` or functions it calls. Extension module load must not fail when Maestro env vars are absent.

- `MAESTRO_BASE_URL` is required for actual calls.
- `MAESTRO_API_KEY` is optional at load time and sent as `X-API-Key` only when present.
- `MAESTRO_CLIENT_TIMEOUT_MS` defaults to `310000`.

## Fetch Cancellation

Pi passes an `AbortSignal` to tool execution. Maestro tools must pass it to `fetch()` or combine it with the client timeout signal so Esc/cancel can abort in-flight calls.

## Contract Version Injection

`callMaestro()` injects `contract_version: "1.0"` into POST bodies. GET and DELETE requests do not need a request body unless Maestro adds such a route later.

## Return Contract

Pi tools must return a Pi tool result object:

```ts
{
  content: [{ type: "text", text: "..." }],
  details: data,
}
```

Do not return raw strings or raw objects directly from `execute()`.

## Forbidden Patterns

| Pattern | Reason |
| --- | --- |
| `process.env` outside `getMaestroConfig()` | Env access must be lazy |
| `export const maestro_` | Pi extension should register tools, not named-export them |
| `export default {` | Must default-export an extension factory function |
| `maestro_vector_collections_` | Legacy non-canonical collection names |
| raw `return data` from registered tool `execute()` | Must return Pi tool result shape |

## Validation

Run before committing changes:

```bash
~/.agents/adapters/pi/maestro/check-contract.sh ~/.agents/adapters/pi/extensions/maestro.ts
~/.agents/adapters/pi/maestro/tests/check-schema-sync.sh
```
