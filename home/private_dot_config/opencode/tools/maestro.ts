import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

// Import canonical schemas
import maestroSchemas from "./_schemas/maestro.schema.json";

const BASE_URL = "http://localhost:8100";
const API_KEY = process.env.MAESTRO_API_KEY;

if (!API_KEY) {
  throw new Error("MAESTRO_API_KEY is not set");
}

// Shared HTTP executor
async function callMaestro(path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
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

  if (data.status && data.status !== "completed") {
    throw new Error(`Maestro error (${data.status}): ${data.error ?? "unknown error"}`);
  }

  return data;
}

/* -------------------------
 * Tool definitions
 * ------------------------- */

export const run = tool({
  description: "Execute a Maestro run",
  schema: z.object(maestroSchemas.run),
  async execute(args) {
    return callMaestro("/run", args);
  },
});

export const pipeline = tool({
  description: "Execute a Maestro pipeline",
  schema: z.object(maestroSchemas.pipeline),
  async execute(args) {
    return callMaestro("/pipeline", args);
  },
});

export const llm = tool({
  description: "Invoke an LLM via Maestro",
  schema: z.object(maestroSchemas.llm),
  async execute(args) {
    return callMaestro("/llm", args);
  },
});

export const embed = tool({
  description: "Generate embeddings via Maestro",
  schema: z.object(maestroSchemas.embed),
  async execute(args) {
    return callMaestro("/embed", args);
  },
});

export const vector_upsert = tool({
  description: "Upsert vectors into Maestro storage",
  schema: z.object(maestroSchemas["vector.upsert"]),
  async execute(args) {
    return callMaestro("/vector/upsert", args);
  },
});

export const vector_search = tool({
  description: "Search vectors via Maestro",
  schema: z.object(maestroSchemas["vector.search"]),
  async execute(args) {
    return callMaestro("/vector/search", args);
  },
});

export const vector_delete = tool({
  description: "Delete vectors via Maestro",
  schema: z.object(maestroSchemas["vector.delete"]),
  async execute(args) {
    return callMaestro("/vector/delete", args);
  },
});

export const file_read = tool({
  description: "Read a file via Maestro",
  schema: z.object(maestroSchemas.file_read),
  async execute(args) {
    return callMaestro("/file/read", args);
  },
});

export const file_write = tool({
  description: "Write a file via Maestro",
  schema: z.object(maestroSchemas.file_write),
  async execute(args) {
    return callMaestro("/file/write", args);
  },
});

export const health = tool({
  description: "Check Maestro health",
  async execute() {
    return callMaestro("/health");
  },
});
