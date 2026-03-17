import { tool } from "@opencode-ai/plugin";
import { z, type ZodTypeAny } from "zod";

import maestroSchemas from "./_schemas/maestro.schema.json";

const BASE_URL = "http://localhost:8100";

interface JsonSchemaProp {
  type: string;
  nullable?: boolean;
}

interface ToolSchema {
  properties: Record<string, JsonSchemaProp>;
  required: string[];
}

// Convert a JSON Schema properties block into a z.object() schema
function jsonSchemaToZod(def: ToolSchema): ReturnType<typeof z.object> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(def.properties)) {
    let field: ZodTypeAny;

    switch (prop.type) {
      case "string":
        field = z.string();
        break;
      case "number":
        field = z.number();
        break;
      case "integer":
        field = z.number().int();
        break;
      case "boolean":
        field = z.boolean();
        break;
      case "array":
        field = z.array(z.unknown());
        break;
      case "object":
        field = z.record(z.unknown());
        break;
      default:
        field = z.unknown();
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
          contract_version: "1.0",
          ...body,
        })
      : undefined,
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Maestro returned non-JSON response (${res.status}):\n${text}`);
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
  async execute() {
    return callMaestro("/health");
  },
});
