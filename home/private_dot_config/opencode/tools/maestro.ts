import { tool } from "@opencode-ai/plugin";
import { z, type ZodTypeAny } from "zod";

import maestroSchemas from "./_schemas/maestro.schema.json";

// Constraint enforcement model:
// Role/adapter JSON files (e.g. planner/tools/maestro.json) declare constraints
// like allow_shell: false as advisory metadata for agent planners. This client
// does NOT enforce those constraints — enforcement is server-side via feature
// flags (MAESTRO_ALLOW_SHELL, MAESTRO_ALLOW_DOCKER, etc.).

const BASE_URL = process.env.MAESTRO_BASE_URL ?? "http://localhost:8100";
const CLIENT_TIMEOUT_MS = Number(process.env.MAESTRO_CLIENT_TIMEOUT_MS) || 310_000;

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
async function callMaestro(path: string, body?: Record<string, unknown>) {
  const apiKey = process.env.MAESTRO_API_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  } else if (body) {
    throw new Error("MAESTRO_API_KEY is required for non-GET requests");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body
      ? JSON.stringify({
          ...body,
          contract_version: "1.0",
        })
      : undefined,
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
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
  description: "Execute a Maestro run",
  schema: jsonSchemaToZod(maestroSchemas.run as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/run", args);
  },
});

export const pipeline = tool({
  description: "Execute a Maestro pipeline",
  schema: jsonSchemaToZod(maestroSchemas.pipeline as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/pipeline", args);
  },
});

export const llm = tool({
  description: "Invoke an LLM via Maestro",
  schema: jsonSchemaToZod(maestroSchemas.llm as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/llm", args);
  },
});

export const embed = tool({
  description: "Generate embeddings via Maestro",
  schema: jsonSchemaToZod(maestroSchemas.embed as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/embed", args);
  },
});

export const vector_upsert = tool({
  description: "Upsert vectors into Maestro storage",
  schema: jsonSchemaToZod(maestroSchemas["vector.upsert"] as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/vector/upsert", args);
  },
});

export const vector_search = tool({
  description: "Search vectors via Maestro",
  schema: jsonSchemaToZod(maestroSchemas["vector.search"] as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/vector/search", args);
  },
});

export const vector_delete = tool({
  description: "Delete vectors via Maestro",
  schema: jsonSchemaToZod(maestroSchemas["vector.delete"] as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/vector/delete", args);
  },
});

export const file_read = tool({
  description: "Read a file via Maestro",
  schema: jsonSchemaToZod(maestroSchemas.file_read as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/file/read", args);
  },
});

export const file_write = tool({
  description: "Write a file via Maestro",
  schema: jsonSchemaToZod(maestroSchemas.file_write as ToolSchema),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/file/write", args);
  },
});

export const health = tool({
  description: "Check Maestro health",
  schema: z.object({}),
  async execute() {
    return callMaestro("/health");
  },
});

export const vector_collections_list = tool({
  description: "List all vector collections",
  schema: jsonSchemaToZod(
    maestroSchemas["vector.collections.list"] as ToolSchema,
  ),
  async execute(args: Record<string, unknown>) {
    const query = args.backend ? `?backend=${args.backend}` : "";
    return callMaestro(`/vector/collections${query}`);
  },
});

export const vector_collections_create = tool({
  description: "Create a vector collection",
  schema: jsonSchemaToZod(
    maestroSchemas["vector.collections.create"] as ToolSchema,
  ),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/vector/collections", args);
  },
});

export const vector_collections_delete = tool({
  description: "Delete a vector collection",
  schema: jsonSchemaToZod(
    maestroSchemas["vector.collections.delete"] as ToolSchema,
  ),
  async execute(args: Record<string, unknown>) {
    const { name } = args as { name: string };
    const apiKey = process.env.MAESTRO_API_KEY;
    if (!apiKey) {
      throw new Error("MAESTRO_API_KEY is required for DELETE requests");
    }
    const res = await fetch(
      `${BASE_URL}/vector/collections/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
        headers: { "X-API-Key": apiKey },
        signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Maestro /vector/collections/${name} returned HTTP ${res.status}: ${text}`,
      );
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(
        `Maestro /vector/collections/${name} returned non-JSON response (${res.status}): ${(err as Error).message}\n${text}`,
      );
    }
  },
});
