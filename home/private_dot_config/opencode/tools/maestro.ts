import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

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

// Shared HTTP executor — returns a JSON string for OpenCode tool results
async function callMaestro(
  path: string,
  options?: {
    body?: Record<string, unknown>;
    method?: "GET" | "POST" | "DELETE";
  },
): Promise<string> {
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

  return JSON.stringify(data ?? {});
}

/* -------------------------
 * Tool definitions
 * ------------------------- */

const ENV_NOTE =
  "Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.";

export const run = tool("maestro_run", {
  description: `Execute a Maestro run. ${ENV_NOTE}`,
  input: z.object({
    command: z.string(),
    timeout: z.number().int().nullable().optional(),
    workdir: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/run", { body: args });
  },
});

export const pipeline = tool("maestro_pipeline", {
  description: `Execute a Maestro pipeline. ${ENV_NOTE}`,
  input: z.object({
    steps: z.array(z.unknown()),
    stop_on_error: z.boolean().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/pipeline", { body: args });
  },
});

export const llm = tool("maestro_llm", {
  description: `Invoke an LLM via Maestro. ${ENV_NOTE}`,
  input: z.object({
    model: z.string(),
    prompt: z.string(),
    system: z.string().nullable().optional(),
    temperature: z.number().nullable().optional(),
    max_tokens: z.number().int().nullable().optional(),
    backend: z.string().nullable().optional(),
    quantization: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/llm", { body: args });
  },
});

export const embed = tool("maestro_embed", {
  description: `Generate embeddings via Maestro. ${ENV_NOTE}`,
  input: z.object({
    input: z.union([z.string(), z.array(z.string())]),
    model: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/embed", { body: args });
  },
});

export const vector_upsert = tool("maestro_vector_upsert", {
  description: `Upsert vectors into Maestro storage. ${ENV_NOTE}`,
  input: z.object({
    collection: z.string(),
    points: z.array(z.unknown()),
    backend: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/vector/upsert", { body: args });
  },
});

export const vector_search = tool("maestro_vector_search", {
  description: `Search vectors via Maestro. ${ENV_NOTE}`,
  input: z.object({
    collection: z.string(),
    vector: z.array(z.number()),
    limit: z.number().int(),
    filter: z.record(z.unknown()).nullable().optional(),
    with_payload: z.boolean().nullable().optional(),
    with_vectors: z.boolean().nullable().optional(),
    backend: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/vector/search", { body: args });
  },
});

export const vector_delete = tool("maestro_vector_delete", {
  description: `Delete vectors via Maestro. ${ENV_NOTE}`,
  input: z.object({
    collection: z.string(),
    ids: z.array(z.unknown()),
    backend: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/vector/delete", { body: args });
  },
});

export const file_read = tool("maestro_file_read", {
  description: `Read a file via Maestro. ${ENV_NOTE}`,
  input: z.object({
    path: z.string(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/file/read", { body: args });
  },
});

export const file_write = tool("maestro_file_write", {
  description: `Write a file via Maestro. ${ENV_NOTE}`,
  input: z.object({
    path: z.string(),
    content: z.string(),
    mode: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/file/write", { body: args });
  },
});

export const health = tool("maestro_health", {
  description: `Check Maestro health. ${ENV_NOTE}`,
  input: z.object({}),
  async execute() {
    return callMaestro("/health");
  },
});

export const vector_collections_list = tool("maestro_vector_collections_list", {
  description: `List all vector collections. ${ENV_NOTE}`,
  input: z.object({
    backend: z.string().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    const query = args.backend ? `?backend=${args.backend}` : "";
    return callMaestro(`/vector/collections${query}`);
  },
});

export const vector_collections_create = tool("maestro_vector_collections_create", {
  description: `Create a vector collection. ${ENV_NOTE}`,
  input: z.object({
    name: z.string(),
    vector_size: z.number().int(),
    distance: z.string().nullable().optional(),
    if_not_exists: z.boolean().nullable().optional(),
    options: z.record(z.unknown()).nullable().optional(),
    backend: z.string().nullable().optional(),
  }),
  async execute(args: Record<string, unknown>) {
    return callMaestro("/vector/collections", { body: args });
  },
});

export const vector_collections_delete = tool("maestro_vector_collections_delete", {
  description: `Delete a vector collection. ${ENV_NOTE}`,
  input: z.object({
    name: z.string(),
  }),
  async execute(args: Record<string, unknown>) {
    return callMaestro(
      `/vector/collections/${encodeURIComponent(args.name as string)}`,
      { method: "DELETE" },
    );
  },
});
