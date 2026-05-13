import { tool } from "@opencode-ai/plugin";

const z = tool.schema;

// Constraint enforcement model:
// Role/adapter JSON files (e.g. planner/tools/maestro.json) declare constraints
// like allow_shell: false as advisory metadata for agent planners. This client
// does NOT enforce those constraints — enforcement is server-side via feature
// flags (MAESTRO_ALLOW_SHELL, MAESTRO_ALLOW_DOCKER, MAESTRO_ALLOW_MEMORY, etc.).
//
// Configuration model:
// MAESTRO_BASE_URL, MAESTRO_API_KEY, and MAESTRO_CLIENT_TIMEOUT_MS are resolved
// lazily inside each handler call via getMaestroConfig(). This avoids module-load
// failures that would break tool registration and ensures env changes are picked
// up at invocation time.

function getMaestroConfig() {
  const baseUrl = process.env.MAESTRO_BASE_URL;
  const apiKey = process.env.MAESTRO_API_KEY;
  const timeoutMs = Number(process.env.MAESTRO_CLIENT_TIMEOUT_MS) || 310_000;

  if (!baseUrl) {
    throw new Error("Maestro configuration missing. Set MAESTRO_BASE_URL.");
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, timeoutMs };
}

type MaestroMethod = "GET" | "POST" | "DELETE";
type MaestroBody = Record<string, unknown>;

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== null)) as T;
}

function planned(toolName: string, params: MaestroBody): string {
  return JSON.stringify({
    task_id: "dry-run",
    status: "planned",
    result: { tool: toolName, params: stripUndefined(params) },
    error: null,
  });
}

function queryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

// Shared HTTP executor — returns a JSON string for OpenCode tool results.
async function callMaestro(
  path: string,
  options?: {
    body?: MaestroBody;
    method?: MaestroMethod;
    responseType?: "json" | "text";
  }
): Promise<string> {
  const { baseUrl, apiKey, timeoutMs } = getMaestroConfig();
  const body = options?.body;
  const method = options?.method ?? (body ? "POST" : "GET");
  const responseType = options?.responseType ?? "json";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["X-API-Key"] = apiKey;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body
      ? JSON.stringify({
          ...stripUndefined(body),
          contract_version: "1.0",
        })
      : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Maestro ${path} returned HTTP ${res.status}: ${text}`);
  }

  if (responseType === "text") {
    return JSON.stringify({ content_type: res.headers.get("content-type") ?? "text/plain", text });
  }

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Maestro ${path} returned non-JSON response (${res.status}): ${(err as Error).message}\n${text}`);
  }

  // Server-side failure: HTTP 200 does not guarantee success.
  if (data?.status === "failed") {
    const parts = [`Maestro ${path} returned status "failed"`];
    if (data.task_id) parts.push(`task_id=${data.task_id}`);
    if (data.execution_id) parts.push(`execution_id=${data.execution_id}`);
    if (data.error) parts.push(`error=${data.error}`);
    throw new Error(parts.join("; "));
  }

  return JSON.stringify(data ?? {});
}

/* -------------------------
 * Tool definitions
 * ------------------------- */

const ENV_NOTE = "Requires MAESTRO_BASE_URL. Set MAESTRO_API_KEY when the Maestro server requires authentication.";

export const maestro_health = tool({
  description: `Check Maestro liveness. ${ENV_NOTE}`,
  args: {},
  async execute(_args, _context) {
    return callMaestro("/health");
  },
});

export const maestro_health_detailed = tool({
  description: `Check detailed Maestro health including backend status. ${ENV_NOTE}`,
  args: {},
  async execute(_args, _context) {
    return callMaestro("/health/detailed");
  },
});

export const maestro_capabilities = tool({
  description: `List Maestro tools, backends, feature flags, and supported contract versions. ${ENV_NOTE}`,
  args: {},
  async execute(_args, _context) {
    return callMaestro("/capabilities");
  },
});

export const maestro_manifest = tool({
  description: `Fetch Maestro's machine-readable tool manifest. ${ENV_NOTE}`,
  args: {},
  async execute(_args, _context) {
    return callMaestro("/manifest");
  },
});

export const maestro_metrics = tool({
  description: `Fetch Maestro runtime metrics as JSON. ${ENV_NOTE}`,
  args: {},
  async execute(_args, _context) {
    return callMaestro("/metrics");
  },
});

export const maestro_metrics_prometheus = tool({
  description: `Fetch Maestro runtime metrics in Prometheus/OpenMetrics text format. ${ENV_NOTE}`,
  args: {},
  async execute(_args, _context) {
    return callMaestro("/metrics/prometheus", { responseType: "text" });
  },
});

export const maestro_run = tool({
  description: `Execute a shell command through Maestro. Server must allow shell execution. ${ENV_NOTE}`,
  args: {
    command: z.string(),
    timeout: z.number().int().nullable().optional(),
    workdir: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("run", args);
    return callMaestro("/run", { body: { ...args } });
  },
});

export const maestro_llm = tool({
  description: `Invoke an LLM via Maestro. ${ENV_NOTE}`,
  args: {
    model: z.string(),
    prompt: z.string(),
    system: z.string().nullable().optional(),
    temperature: z.number().nullable().optional(),
    max_tokens: z.number().int().nullable().optional(),
    backend: z.string().nullable().optional(),
    quantization: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("llm", args);
    return callMaestro("/llm", { body: { ...args } });
  },
});

export const maestro_embed = tool({
  description: `Generate embeddings via Maestro. ${ENV_NOTE}`,
  args: {
    input: z.union([z.string(), z.array(z.string())]),
    model: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("embed", args);
    return callMaestro("/embed", { body: { ...args } });
  },
});

export const maestro_pipeline = tool({
  description: `Execute a Maestro pipeline. ${ENV_NOTE}`,
  args: {
    steps: z.array(z.unknown()),
    stop_on_error: z.boolean().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("pipeline", args);
    return callMaestro("/pipeline", { body: { ...args } });
  },
});

export const maestro_vector_upsert = tool({
  description: `Upsert vectors into a Maestro vector collection. ${ENV_NOTE}`,
  args: {
    collection: z.string(),
    points: z.array(z.unknown()),
    backend: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("vector.upsert", args);
    return callMaestro("/vector/upsert", { body: { ...args } });
  },
});

export const maestro_vector_search = tool({
  description: `Search vectors via Maestro. ${ENV_NOTE}`,
  args: {
    collection: z.string(),
    vector: z.array(z.number()),
    limit: z.number().int().nullable().optional(),
    filter: z.record(z.string(), z.unknown()).nullable().optional(),
    with_payload: z.boolean().nullable().optional(),
    with_vectors: z.boolean().nullable().optional(),
    backend: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("vector.search", args);
    return callMaestro("/vector/search", { body: { ...args } });
  },
});

export const maestro_vector_delete = tool({
  description: `Delete vectors via Maestro. ${ENV_NOTE}`,
  args: {
    collection: z.string(),
    ids: z.array(z.unknown()),
    backend: z.string().nullable().optional(),
    callback_url: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("vector.delete", args);
    return callMaestro("/vector/delete", { body: { ...args } });
  },
});

export const maestro_vector_list_collections = tool({
  description: `List Maestro vector collections. ${ENV_NOTE}`,
  args: {
    backend: z.string().nullable().optional(),
  },
  async execute(args, _context) {
    return callMaestro(`/vector/collections${queryString({ backend: args.backend })}`);
  },
});

export const maestro_vector_create_collection = tool({
  description: `Create a Maestro vector collection. ${ENV_NOTE}`,
  args: {
    name: z.string(),
    vector_size: z.number().int(),
    distance: z.string().nullable().optional(),
    if_not_exists: z.boolean().nullable().optional(),
    options: z.record(z.string(), z.unknown()).nullable().optional(),
    backend: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("vector.create_collection", args);
    return callMaestro("/vector/collections", { body: { ...args } });
  },
});

export const maestro_vector_delete_collection = tool({
  description: `Delete a Maestro vector collection. ${ENV_NOTE}`,
  args: {
    name: z.string(),
  },
  async execute(args, _context) {
    return callMaestro(`/vector/collections/${encodeURIComponent(args.name)}`, { method: "DELETE" });
  },
});

export const maestro_memory_put = tool({
  description: `Store a planner-managed memory item. Server must allow memory tooling. ${ENV_NOTE}`,
  args: {
    namespace: z.string(),
    session_id: z.string().nullable().optional(),
    kind: z.string(),
    text: z.string(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    index_semantic: z.boolean().nullable().optional(),
    ttl_seconds: z.number().int().nullable().optional(),
    id: z.string().nullable().optional(),
    dedupe_key: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("memory.put", args);
    return callMaestro("/memory/put", { body: { ...args } });
  },
});

export const maestro_memory_get = tool({
  description: `Retrieve a planner-managed memory item. ${ENV_NOTE}`,
  args: {
    namespace: z.string(),
    id: z.string(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("memory.get", args);
    return callMaestro("/memory/get", { body: { ...args } });
  },
});

export const maestro_memory_search = tool({
  description: `Search planner-managed memory items using exact filters or semantic retrieval. ${ENV_NOTE}`,
  args: {
    namespace: z.string(),
    session_id: z.string().nullable().optional(),
    query: z.string().nullable().optional(),
    limit: z.number().int().nullable().optional(),
    kind: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    semantic: z.boolean().nullable().optional(),
    include_expired: z.boolean().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("memory.search", args);
    return callMaestro("/memory/search", { body: { ...args } });
  },
});

export const maestro_memory_list = tool({
  description: `List planner-managed memory items using exact filters. ${ENV_NOTE}`,
  args: {
    namespace: z.string(),
    session_id: z.string().nullable().optional(),
    kind: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    include_expired: z.boolean().nullable().optional(),
    limit: z.number().int().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("memory.list", args);
    return callMaestro("/memory/list", { body: { ...args } });
  },
});

export const maestro_memory_delete = tool({
  description: `Delete a planner-managed memory item. ${ENV_NOTE}`,
  args: {
    namespace: z.string(),
    id: z.string(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("memory.delete", args);
    return callMaestro("/memory/delete", { body: { ...args } });
  },
});

export const maestro_file_read = tool({
  description: `Read a file from Maestro's allowed file base directory. ${ENV_NOTE}`,
  args: {
    path: z.string(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("file_read", args);
    return callMaestro("/file/read", { body: { ...args } });
  },
});

export const maestro_file_write = tool({
  description: `Write a file in Maestro's allowed file base directory. ${ENV_NOTE}`,
  args: {
    path: z.string(),
    content: z.string(),
    mode: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("file_write", args);
    return callMaestro("/file/write", { body: { ...args } });
  },
});

export const maestro_docker_run = tool({
  description: `Run a Docker container through Maestro. Server must allow Docker tooling. ${ENV_NOTE}`,
  args: {
    image: z.string(),
    command: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    env: z.record(z.string(), z.string()).nullable().optional(),
    volumes: z.record(z.string(), z.string()).nullable().optional(),
    detach: z.boolean().nullable().optional(),
    remove: z.boolean().nullable().optional(),
    name: z.string().nullable().optional(),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    if (args.dry_run) return planned("docker_run", args);
    return callMaestro("/docker/run", { body: { ...args } });
  },
});

export const maestro_docker_status = tool({
  description: `Inspect a Docker container through Maestro. ${ENV_NOTE}`,
  args: {
    container_id: z.string(),
  },
  async execute(args, _context) {
    return callMaestro(`/docker/${encodeURIComponent(args.container_id)}/status`);
  },
});

export const maestro_docker_logs = tool({
  description: `Fetch Docker container logs through Maestro. ${ENV_NOTE}`,
  args: {
    container_id: z.string(),
    tail: z.number().int().nullable().optional(),
  },
  async execute(args, _context) {
    return callMaestro(`/docker/${encodeURIComponent(args.container_id)}/logs${queryString({ tail: args.tail })}`);
  },
});

export const maestro_docker_exec = tool({
  description: `Execute a command in a running Docker container through Maestro. ${ENV_NOTE}`,
  args: {
    container_id: z.string(),
    command: z.union([z.string(), z.array(z.string())]),
    dry_run: z.boolean().nullable().optional(),
  },
  async execute(args, _context) {
    const { container_id, ...body } = args;
    if (args.dry_run) return planned("docker_exec", args);
    return callMaestro(`/docker/${encodeURIComponent(container_id)}/exec`, { body });
  },
});

export const maestro_docker_stop = tool({
  description: `Stop a running Docker container through Maestro. ${ENV_NOTE}`,
  args: {
    container_id: z.string(),
  },
  async execute(args, _context) {
    return callMaestro(`/docker/${encodeURIComponent(args.container_id)}/stop`, { method: "POST" });
  },
});

export const maestro_docker_remove = tool({
  description: `Remove a Docker container through Maestro. ${ENV_NOTE}`,
  args: {
    container_id: z.string(),
  },
  async execute(args, _context) {
    return callMaestro(`/docker/${encodeURIComponent(args.container_id)}`, { method: "DELETE" });
  },
});
