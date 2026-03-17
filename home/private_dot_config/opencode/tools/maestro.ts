import { tool } from "@opencode-ai/plugin";
import { z, type ZodTypeAny } from "zod";

import maestroSchemas from "./_schemas/maestro.schema.json";

// Constraint enforcement model:
// Role/adapter JSON files (e.g. planner/tools/maestro.json) declare constraints
// like allow_shell: false as advisory metadata for agent planners. This client
// does NOT enforce those constraints — enforcement is server-side via feature
// flags (MAESTRO_ALLOW_SHELL, MAESTRO_ALLOW_DOCKER, etc.).
//
// Configuration model:
// MAESTRO_BASE_URL and MAESTRO_API_KEY are resolved lazily inside each handler
// call via getMaestroConfig(). This avoids module-load failures that would break
// tool registration and ensures env changes are picked up at invocation time.

function getMaestroConfig() {
  const baseUrl = process.env.MAESTRO_BASE_URL;
  const apiKey = process.env.MAESTRO_API_KEY;
  const timeoutMs =
    Number(process.env.MAESTRO_CLIENT_TIMEOUT_MS) || 310_000;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Maestro configuration missing. Set MAESTRO_BASE_URL and MAESTRO_API_KEY.",
    );
  }

  return { baseUrl, apiKey, timeoutMs };
}

interface JsonSchemaProp {
  type: string | string[];
  nullable?: boolean;
  description?: string;
  items?: { type: string };
}

interface ToolSchema {
  properties: Record<string, JsonSchemaProp>;
  required: string[];
}

// Map a single JSON Schema type string to its Zod equivalent
function zodForType(t: string, items?: { type: string }): ZodTypeAny {
  switch (t) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "integer":
      return z.number().int();
    case "boolean":
      return z.boolean();
    case "array":
      if (items?.type === "string") return z.array(z.string());
      if (items?.type === "number") return z.array(z.number());
      return z.array(z.unknown());
    case "object":
      return z.record(z.unknown());
    default:
      return z.unknown();
  }
}

// Convert a JSON Schema properties block into a z.object() schema
function jsonSchemaToZod(def: ToolSchema): ReturnType<typeof z.object> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(def.properties)) {
    let field: ZodTypeAny;

    if (Array.isArray(prop.type)) {
      // Union type — e.g. ["string", "array"]
      const variants = prop.type.map((t) => zodForType(t, prop.items));
      field =
        variants.length === 1
          ? variants[0]
          : z.union(
              variants as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]],
            );
    } else {
      field = zodForType(prop.type, prop.items);
    }

    if (prop.description) {
      field = field.describe(prop.description);
    }

    if (prop.nullable) {
      field = field.nullable();
    }

    if (!def.required.includes(key)) {
      field = field.optional();
    }

    shape[key] = field;
  }

  return z.object(shape);
}

// Shared HTTP executor
async function callMaestro(
  path: string,
  options?: {
    body?: Record<string, unknown>;
    method?: "GET" | "POST" | "DELETE";
  },
) {
  const { baseUrl, apiKey, timeoutMs } = getMaestroConfig();
  const body = options?.body;
  const method = options?.method ?? (body ? "POST" : "GET");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body
      ? JSON.stringify({
          ...body,
          contract_version: "1.0",
        })
      : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Maestro ${path} returned HTTP ${res.status}: ${text}`,
    );
  }

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Maestro ${path} returned non-JSON response (${res.status}): ${(err as Error).message}\n${text}`,
    );
  }

  // Server-side failure: HTTP 200 does not guarantee success
  if (data?.status === "failed") {
    throw new Error(
      `Maestro ${path} returned status "failed": ${data.error ?? JSON.stringify(data)}`,
    );
  }

  // Normalize return value for OpenCode
  if (data === undefined || data === null) {
    return {};
  }

  if (typeof data !== "object") {
    return { value: data };
  }

  return data;
}

/* -------------------------
 * Tool definitions
 * ------------------------- */

export const run = tool({
  description:
    "Execute a Maestro run. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas.run as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/run", { body: args });
  },
});

export const pipeline = tool({
  description:
    "Execute a Maestro pipeline. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas.pipeline as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/pipeline", { body: args });
  },
});

export const llm = tool({
  description:
    "Invoke an LLM via Maestro. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas.llm as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/llm", { body: args });
  },
});

export const embed = tool({
  description:
    "Generate embeddings via Maestro. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas.embed as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/embed", { body: args });
  },
});

export const vector_upsert = tool({
  description:
    "Upsert vectors into Maestro storage. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas["vector.upsert"] as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/vector/upsert", { body: args });
  },
});

export const vector_search = tool({
  description:
    "Search vectors via Maestro. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas["vector.search"] as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/vector/search", { body: args });
  },
});

export const vector_delete = tool({
  description:
    "Delete vectors via Maestro. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas["vector.delete"] as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/vector/delete", { body: args });
  },
});

export const file_read = tool({
  description:
    "Read a file via Maestro. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas.file_read as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/file/read", { body: args });
  },
});

export const file_write = tool({
  description:
    "Write a file via Maestro. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(maestroSchemas.file_write as ToolSchema),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return { ok: true, dry_run: true, ...args };
    return callMaestro("/file/write", { body: args });
  },
});

export const health = tool({
  description:
    "Check Maestro health. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: z.object({}),
  async execute() {
    return callMaestro("/health");
  },
});

export const vector_collections_list = tool({
  description:
    "List all vector collections. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(
    maestroSchemas["vector.collections.list"] as ToolSchema,
  ),
  async execute(args: Record<string, unknown>) {
    const query = args.backend ? `?backend=${args.backend}` : "";
    return callMaestro(`/vector/collections${query}`);
  },
});

export const vector_collections_create = tool({
  description:
    "Create a vector collection. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(
    maestroSchemas["vector.collections.create"] as ToolSchema,
  ),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/vector/collections", { body: args });
  },
});

export const vector_collections_delete = tool({
  description:
    "Delete a vector collection. Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.",
  schema: jsonSchemaToZod(
    maestroSchemas["vector.collections.delete"] as ToolSchema,
  ),
  async execute(args: Record<string, unknown>) {
    const { name } = args as { name: string };
    return callMaestro(
      `/vector/collections/${encodeURIComponent(name)}`,
      { method: "DELETE" },
    );
  },
});
