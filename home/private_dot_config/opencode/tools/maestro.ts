import { tool } from "@opencode-ai/plugin";

const z = tool.schema;

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
  const timeoutMs = Number(process.env.MAESTRO_CLIENT_TIMEOUT_MS) || 310_000;

  if (!baseUrl || !apiKey) {
    throw new Error("Maestro configuration missing. Set MAESTRO_BASE_URL and MAESTRO_API_KEY.");
  }

  return { baseUrl, apiKey, timeoutMs };
}

// Shared HTTP executor — returns a JSON string for OpenCode tool results
async function callMaestro(
  path: string,
  options?: {
    body?: Record<string, unknown>;
    method?: "GET" | "POST" | "DELETE";
  }
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
    throw new Error(`Maestro ${path} returned HTTP ${res.status}: ${text}`);
  }

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Maestro ${path} returned non-JSON response (${res.status}): ${(err as Error).message}\n${text}`);
  }

  // Server-side failure: HTTP 200 does not guarantee success
  if (data?.status === "failed") {
    throw new Error(`Maestro ${path} returned status "failed": ${data.error ?? JSON.stringify(data)}`);
  }

  return JSON.stringify(data ?? {});
}

/* -------------------------
 * Tool definitions
 * ------------------------- */

const ENV_NOTE = "Requires MAESTRO_BASE_URL and MAESTRO_API_KEY to be set in the environment.";

export const maestro_run = tool({
  description: `Execute a Maestro run. ${ENV_NOTE}`,
  args: z.object({
    command: z.string(),
    timeout: z.number().int().nullable().optional(),
    workdir: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/run", { body: { ...args } });
  },
});

export const maestro_pipeline = tool({
  description: `Execute a Maestro pipeline. ${ENV_NOTE}`,
  args: z.object({
    steps: z.array(z.unknown()),
    stop_on_error: z.boolean().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/pipeline", { body: { ...args } });
  },
});

export const maestro_llm = tool({
  description: `Invoke an LLM via Maestro. ${ENV_NOTE}`,
  args: z.object({
    model: z.string(),
    prompt: z.string(),
    system: z.string().nullable().optional(),
    temperature: z.number().nullable().optional(),
    max_tokens: z.number().int().nullable().optional(),
    backend: z.string().nullable().optional(),
    quantization: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/llm", { body: { ...args } });
  },
});

export const maestro_embed = tool({
  description: `Generate embeddings via Maestro. ${ENV_NOTE}`,
  args: z.object({
    input: z.union([z.string(), z.array(z.string())]),
    model: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/embed", { body: { ...args } });
  },
});

export const maestro_vector_upsert = tool({
  description: `Upsert vectors into Maestro storage. ${ENV_NOTE}`,
  args: z.object({
    collection: z.string(),
    points: z.array(z.unknown()),
    backend: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/vector/upsert", { body: { ...args } });
  },
});

export const maestro_vector_search = tool({
  description: `Search vectors via Maestro. ${ENV_NOTE}`,
  args: z.object({
    collection: z.string(),
    vector: z.array(z.number()),
    limit: z.number().int(),
    filter: z.record(z.unknown()).nullable().optional(),
    with_payload: z.boolean().nullable().optional(),
    with_vectors: z.boolean().nullable().optional(),
    backend: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/vector/search", { body: { ...args } });
  },
});

export const maestro_vector_delete = tool({
  description: `Delete vectors via Maestro. ${ENV_NOTE}`,
  args: z.object({
    collection: z.string(),
    ids: z.array(z.unknown()),
    backend: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/vector/delete", { body: { ...args } });
  },
});

export const maestro_file_read = tool({
  description: `Read a file via Maestro. ${ENV_NOTE}`,
  args: z.object({
    path: z.string(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/file/read", { body: { ...args } });
  },
});

export const maestro_file_write = tool({
  description: `Write a file via Maestro. ${ENV_NOTE}`,
  args: z.object({
    path: z.string(),
    content: z.string(),
    mode: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  }),
  async execute(args, _context) {
    if (args.dry_run) return JSON.stringify({ ok: true, dry_run: true, ...args });
    return callMaestro("/file/write", { body: { ...args } });
  },
});

export const maestro_health = tool({
  description: `Check Maestro health. ${ENV_NOTE}`,
  args: z.object({}),
  async execute(_args, _context) {
    return callMaestro("/health");
  },
});

export const maestro_vector_collections_list = tool({
  description: `List all vector collections. ${ENV_NOTE}`,
  args: z.object({
    backend: z.string().nullable().optional(),
  }),
  async execute(args, _context) {
    const query = args.backend ? `?backend=${args.backend}` : "";
    return callMaestro(`/vector/collections${query}`);
  },
});

export const maestro_vector_collections_create = tool({
  description: `Create a vector collection. ${ENV_NOTE}`,
  args: z.object({
    name: z.string(),
    vector_size: z.number().int(),
    distance: z.string().nullable().optional(),
    if_not_exists: z.boolean().nullable().optional(),
    options: z.record(z.unknown()).nullable().optional(),
    backend: z.string().nullable().optional(),
  }),
  async execute(args, _context) {
    return callMaestro("/vector/collections", { body: { ...args } });
  },
});

export const maestro_vector_collections_delete = tool({
  description: `Delete a vector collection. ${ENV_NOTE}`,
  args: z.object({
    name: z.string(),
  }),
  async execute(args, _context) {
    return callMaestro(`/vector/collections/${encodeURIComponent(args.name)}`, { method: "DELETE" });
  },
});
