# Maestro Tool Contract — OpenCode Adapter

> This contract extends the canonical Maestro contract (`~/.agents/skills/maestro/CONTRACT.md`)
> with OpenCode-specific rules for the `@opencode-ai/plugin` runtime.

## Required API Shape

Every Maestro tool **must** use this exact structure:

```ts
import { tool } from "@opencode-ai/plugin";

const z = tool.schema;

export const maestro_<name> = tool({
  description: `<description>. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.`,
  args: {
    // Plain Zod fields (ZodRawShape) — OpenCode's fromPlugin wraps in z.object() internally
  },
  async execute(args, _context) {
    // All env var access via getMaestroConfig() — never at module scope
    // Must return a JSON string (not an object)
  },
});
```

## Required Fields

| Field         | Type                               | Notes                                                      |
| ------------- | ---------------------------------- | ---------------------------------------------------------- |
| `description` | `string`                           | Must include env var requirement note                      |
| `args`        | `ZodRawShape` (plain object)       | Plain Zod fields — `fromPlugin` wraps in `z.object()` internally |
| `execute`     | `async (args, _context) => string` | Must return `JSON.stringify(...)`                          |

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
| `args: z.object(` or `args: s.object(`     | `fromPlugin` wraps args — double-wrapping causes `schema._zod.def` error |
| `import { z } from "zod"`                  | Use `const z = tool.schema` instead                                      |
| `z.record(z.unknown())` (single-arg form)  | Zod v4 sets arg as `keyType`, leaving `valueType` undefined — use `z.record(z.string(), z.unknown())` |

## Environment Variable Access

All env var reads **must** occur inside `getMaestroConfig()`, which is called lazily within
`execute()`. See the canonical contract for the rationale.

## Contract Version Injection

The `contract_version: "1.0"` field is injected automatically by `callMaestro()` into every
POST request body. Individual tools **must not** set `contract_version` in their args schema
or manually include it in request bodies.

## Dry-Run Support

Tools supporting dry-run **must** check `args.dry_run` before calling `callMaestro()` and
return a mock response:

```ts
if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
```

## Validation

Run these scripts before committing changes to `maestro.ts`:

| Script                    | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `check-contract.sh`       | Rejects forbidden patterns in `maestro.ts`      |
| `tests/check-schema-sync.sh` | Verifies `maestro.json` stays in sync with `maestro.ts` |

The canonical `tests/validate-tools.sh` (in `~/.agents/skills/maestro/tests/`) should also
pass — it validates all tools via HTTP against a live Maestro server.
