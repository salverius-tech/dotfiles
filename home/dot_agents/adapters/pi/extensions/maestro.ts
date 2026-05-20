import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const CONTRACT_VERSION = "1.0";
const ENV_NOTE = "Requires MAESTRO_BASE_URL. Set MAESTRO_API_KEY when the Maestro server requires authentication.";

const Nullable = (schema: any) => Type.Optional(Type.Union([schema, Type.Null()]));
const OptString = () => Nullable(Type.String());
const OptBool = () => Nullable(Type.Boolean());
const OptInt = () => Nullable(Type.Integer());
const OptNumber = () => Nullable(Type.Number());
const AnyRecord = () => Type.Record(Type.String(), Type.Any());
const OptRecord = () => Nullable(AnyRecord());
const DryRun = () => Type.Optional(Type.Boolean({ description: "When true, validate/plan without performing side effects" }));

type MaestroMethod = "GET" | "POST" | "DELETE";
type MaestroBody = Record<string, unknown>;

function getMaestroConfig() {
  const baseUrl = process.env.MAESTRO_BASE_URL;
  const authValue = process.env["MAESTRO_API_KEY"];
  const timeoutMs = Number(process.env.MAESTRO_CLIENT_TIMEOUT_MS) || 310_000;

  if (!baseUrl) {
    throw new Error("Maestro configuration missing. Set MAESTRO_BASE_URL.");
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), authValue, timeoutMs };
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== null)) as T;
}

function queryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

function planned(toolName: string, params: MaestroBody) {
  return {
    task_id: "dry-run",
    status: "planned",
    result: { tool: toolName, params: stripUndefined(params) },
    error: null,
  };
}

async function callMaestro(
  path: string,
  options?: {
    body?: MaestroBody;
    method?: MaestroMethod;
    responseType?: "json" | "text";
    signal?: AbortSignal;
  },
): Promise<unknown> {
  const { baseUrl, authValue, timeoutMs } = getMaestroConfig();
  const body = options?.body;
  const method = options?.method ?? (body ? "POST" : "GET");
  const responseType = options?.responseType ?? "json";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authValue) headers["X-API-Key"] = authValue;

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options?.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify({ ...stripUndefined(body), contract_version: CONTRACT_VERSION }) : undefined,
    signal,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Maestro ${path} returned HTTP ${response.status}: ${text}`);
  }

  if (responseType === "text") {
    return { content_type: response.headers.get("content-type") ?? "text/plain", text };
  }

  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Maestro ${path} returned non-JSON response (${response.status}): ${(error as Error).message}\n${text}`);
  }

  if (data?.status === "failed") {
    const parts = [`Maestro ${path} returned status "failed"`];
    if (data.task_id) parts.push(`task_id=${data.task_id}`);
    if (data.execution_id) parts.push(`execution_id=${data.execution_id}`);
    if (data.error) parts.push(`error=${data.error}`);
    throw new Error(parts.join("; "));
  }

  return data ?? {};
}

function asToolResult(data: unknown) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return {
    content: [{ type: "text" as const, text }],
    details: data,
  };
}

function registerMaestroTool(
  pi: ExtensionAPI,
  definition: {
    name: string;
    label: string;
    description: string;
    promptSnippet?: string;
    promptGuidelines?: string[];
    parameters: any;
    execute: (params: any, signal: AbortSignal | undefined) => Promise<unknown> | unknown;
  },
) {
  pi.registerTool({
    name: definition.name,
    label: definition.label,
    description: `${definition.description} ${ENV_NOTE}`,
    promptSnippet: definition.promptSnippet,
    promptGuidelines: definition.promptGuidelines,
    parameters: definition.parameters,
    async execute(_toolCallId, params, signal) {
      const data = await definition.execute(params, signal);
      return asToolResult(data);
    },
  });
}

export default function maestroExtension(pi: ExtensionAPI) {
  registerMaestroTool(pi, {
    name: "maestro_health",
    label: "Maestro Health",
    description: "Check Maestro liveness.",
    promptSnippet: "Check whether the Maestro executor is alive",
    parameters: Type.Object({}),
    execute: (_params, signal) => callMaestro("/health", { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_health_detailed",
    label: "Maestro Detailed Health",
    description: "Check detailed Maestro health including backend status.",
    promptSnippet: "Inspect Maestro backend and memory health",
    parameters: Type.Object({}),
    execute: (_params, signal) => callMaestro("/health/detailed", { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_capabilities",
    label: "Maestro Capabilities",
    description: "List Maestro tools, backends, feature flags, and supported contract versions.",
    promptSnippet: "List Maestro capabilities and enabled server features",
    parameters: Type.Object({}),
    execute: (_params, signal) => callMaestro("/capabilities", { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_manifest",
    label: "Maestro Manifest",
    description: "Fetch Maestro's machine-readable tool manifest.",
    promptSnippet: "Fetch Maestro tool schemas from the server manifest",
    parameters: Type.Object({}),
    execute: (_params, signal) => callMaestro("/manifest", { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_metrics",
    label: "Maestro Metrics",
    description: "Fetch Maestro runtime metrics as JSON.",
    parameters: Type.Object({}),
    execute: (_params, signal) => callMaestro("/metrics", { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_metrics_prometheus",
    label: "Maestro Prometheus Metrics",
    description: "Fetch Maestro runtime metrics in Prometheus/OpenMetrics text format.",
    parameters: Type.Object({}),
    execute: (_params, signal) => callMaestro("/metrics/prometheus", { responseType: "text", signal }),
  });

  const RunParams = Type.Object({
    command: Type.String(),
    timeout: OptInt(),
    workdir: OptString(),
    callback_url: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_run",
    label: "Maestro Run",
    description: "Execute a shell command through Maestro. Server must allow shell execution.",
    promptSnippet: "Run a shell command through Maestro's local executor",
    promptGuidelines: ["Use maestro_run for deliberate local shell delegation through Maestro, not for routine repository inspection when Pi built-in tools suffice."],
    parameters: RunParams,
    execute: (params, signal) => params.dry_run ? planned("run", params as MaestroBody) : callMaestro("/run", { body: params as MaestroBody, signal }),
  });

  const LlmParams = Type.Object({
    model: Type.String(),
    prompt: Type.String(),
    system: OptString(),
    temperature: OptNumber(),
    max_tokens: OptInt(),
    backend: OptString(),
    quantization: OptString(),
    callback_url: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_llm",
    label: "Maestro LLM",
    description: "Invoke a local or configured LLM through Maestro.",
    promptSnippet: "Ask Maestro to run local or configured LLM inference",
    parameters: LlmParams,
    execute: (params, signal) => params.dry_run ? planned("llm", params as MaestroBody) : callMaestro("/llm", { body: params as MaestroBody, signal }),
  });

  const EmbedParams = Type.Object({
    input: Type.Union([Type.String(), Type.Array(Type.String())]),
    model: OptString(),
    callback_url: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_embed",
    label: "Maestro Embed",
    description: "Generate vector embeddings through Maestro.",
    promptSnippet: "Generate embeddings through Maestro",
    parameters: EmbedParams,
    execute: (params, signal) => params.dry_run ? planned("embed", params as MaestroBody) : callMaestro("/embed", { body: params as MaestroBody, signal }),
  });

  const RerankParams = Type.Object({
    query: Type.String(),
    documents: Type.Array(Type.Any()),
    top_k: OptInt(),
    algorithm: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_rerank",
    label: "Maestro Rerank",
    description: "Rank candidate documents by deterministic local lexical relevance.",
    promptSnippet: "Rank candidate documents by local lexical relevance",
    parameters: RerankParams,
    execute: (params, signal) => params.dry_run ? planned("rerank", params as MaestroBody) : callMaestro("/rerank", { body: params as MaestroBody, signal }),
  });

  const TextChunkParams = Type.Object({
    text: Type.String(),
    strategy: OptString(),
    chunk_size: Type.Integer(),
    overlap: OptInt(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_text_chunk",
    label: "Maestro Text Chunk",
    description: "Split text into deterministic overlapping chunks by characters or words.",
    promptSnippet: "Split text into deterministic chunks",
    parameters: TextChunkParams,
    execute: (params, signal) => params.dry_run ? planned("text.chunk", params as MaestroBody) : callMaestro("/text/chunk", { body: params as MaestroBody, signal }),
  });

  const PipelineParams = Type.Object({
    steps: Type.Array(Type.Any()),
    stop_on_error: OptBool(),
    callback_url: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_pipeline",
    label: "Maestro Pipeline",
    description: "Execute a multi-step Maestro workflow with reference resolution.",
    promptSnippet: "Run a multi-step workflow through Maestro",
    parameters: PipelineParams,
    execute: (params, signal) => params.dry_run ? planned("pipeline", params as MaestroBody) : callMaestro("/pipeline", { body: params as MaestroBody, signal }),
  });

  const VectorUpsertParams = Type.Object({
    collection: Type.String(),
    points: Type.Array(Type.Any()),
    backend: OptString(),
    callback_url: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_vector_upsert",
    label: "Maestro Vector Upsert",
    description: "Upsert vectors into a Maestro vector collection.",
    parameters: VectorUpsertParams,
    execute: (params, signal) => params.dry_run ? planned("vector.upsert", params as MaestroBody) : callMaestro("/vector/upsert", { body: params as MaestroBody, signal }),
  });

  const VectorSearchParams = Type.Object({
    collection: Type.String(),
    vector: Type.Array(Type.Number()),
    limit: OptInt(),
    filter: OptRecord(),
    with_payload: OptBool(),
    with_vectors: OptBool(),
    backend: OptString(),
    callback_url: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_vector_search",
    label: "Maestro Vector Search",
    description: "Search vectors via Maestro.",
    parameters: VectorSearchParams,
    execute: (params, signal) => params.dry_run ? planned("vector.search", params as MaestroBody) : callMaestro("/vector/search", { body: params as MaestroBody, signal }),
  });

  const VectorDeleteParams = Type.Object({
    collection: Type.String(),
    ids: Type.Array(Type.Any()),
    backend: OptString(),
    callback_url: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_vector_delete",
    label: "Maestro Vector Delete",
    description: "Delete vectors via Maestro.",
    parameters: VectorDeleteParams,
    execute: (params, signal) => params.dry_run ? planned("vector.delete", params as MaestroBody) : callMaestro("/vector/delete", { body: params as MaestroBody, signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_vector_list_collections",
    label: "Maestro Vector List Collections",
    description: "List Maestro vector collections.",
    parameters: Type.Object({ backend: OptString() }),
    execute: (params, signal) => callMaestro(`/vector/collections${queryString({ backend: params.backend })}`, { signal }),
  });

  const VectorCreateCollectionParams = Type.Object({
    name: Type.String(),
    vector_size: Type.Integer(),
    distance: OptString(),
    if_not_exists: OptBool(),
    options: OptRecord(),
    backend: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_vector_create_collection",
    label: "Maestro Vector Create Collection",
    description: "Create a Maestro vector collection.",
    parameters: VectorCreateCollectionParams,
    execute: (params, signal) => params.dry_run ? planned("vector.create_collection", params as MaestroBody) : callMaestro("/vector/collections", { body: params as MaestroBody, signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_vector_delete_collection",
    label: "Maestro Vector Delete Collection",
    description: "Delete a Maestro vector collection.",
    parameters: Type.Object({ name: Type.String() }),
    execute: (params, signal) => callMaestro(`/vector/collections/${encodeURIComponent(params.name)}`, { method: "DELETE", signal }),
  });

  const MemoryPutParams = Type.Object({
    namespace: Type.String(),
    session_id: OptString(),
    kind: Type.String(),
    text: Type.String(),
    metadata: OptRecord(),
    index_semantic: OptBool(),
    ttl_seconds: OptInt(),
    id: OptString(),
    dedupe_key: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_memory_put",
    label: "Maestro Memory Put",
    description: "Store a planner-managed memory item. Server must allow memory tooling.",
    promptSnippet: "Store explicit planner-managed memory in Maestro",
    parameters: MemoryPutParams,
    execute: (params, signal) => params.dry_run ? planned("memory.put", params as MaestroBody) : callMaestro("/memory/put", { body: params as MaestroBody, signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_memory_get",
    label: "Maestro Memory Get",
    description: "Retrieve a planner-managed memory item.",
    parameters: Type.Object({ namespace: Type.String(), id: Type.String(), dry_run: DryRun() }),
    execute: (params, signal) => params.dry_run ? planned("memory.get", params as MaestroBody) : callMaestro("/memory/get", { body: params as MaestroBody, signal }),
  });

  const MemorySearchParams = Type.Object({
    namespace: Type.String(),
    session_id: OptString(),
    query: OptString(),
    limit: OptInt(),
    kind: OptString(),
    tags: Nullable(Type.Array(Type.String())),
    semantic: OptBool(),
    include_expired: OptBool(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_memory_search",
    label: "Maestro Memory Search",
    description: "Search planner-managed memory items using exact filters or semantic retrieval.",
    parameters: MemorySearchParams,
    execute: (params, signal) => params.dry_run ? planned("memory.search", params as MaestroBody) : callMaestro("/memory/search", { body: params as MaestroBody, signal }),
  });

  const MemoryListParams = Type.Object({
    namespace: Type.String(),
    session_id: OptString(),
    kind: OptString(),
    tags: Nullable(Type.Array(Type.String())),
    include_expired: OptBool(),
    limit: OptInt(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_memory_list",
    label: "Maestro Memory List",
    description: "List planner-managed memory items using exact filters.",
    parameters: MemoryListParams,
    execute: (params, signal) => params.dry_run ? planned("memory.list", params as MaestroBody) : callMaestro("/memory/list", { body: params as MaestroBody, signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_memory_delete",
    label: "Maestro Memory Delete",
    description: "Delete a planner-managed memory item.",
    parameters: Type.Object({ namespace: Type.String(), id: Type.String(), dry_run: DryRun() }),
    execute: (params, signal) => params.dry_run ? planned("memory.delete", params as MaestroBody) : callMaestro("/memory/delete", { body: params as MaestroBody, signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_file_read",
    label: "Maestro File Read",
    description: "Read a file from Maestro's allowed file base directory.",
    parameters: Type.Object({ path: Type.String(), dry_run: DryRun() }),
    execute: (params, signal) => params.dry_run ? planned("file_read", params as MaestroBody) : callMaestro("/file/read", { body: params as MaestroBody, signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_file_write",
    label: "Maestro File Write",
    description: "Write a file in Maestro's allowed file base directory.",
    parameters: Type.Object({ path: Type.String(), content: Type.String(), mode: OptString(), dry_run: DryRun() }),
    execute: (params, signal) => params.dry_run ? planned("file_write", params as MaestroBody) : callMaestro("/file/write", { body: params as MaestroBody, signal }),
  });

  const ArtifactPutParams = Type.Object({
    content: Type.String(),
    id: OptString(),
    filename: OptString(),
    content_type: OptString(),
    metadata: OptRecord(),
    ttl_seconds: OptInt(),
    expires_at: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_artifact_put",
    label: "Maestro Artifact Put",
    description: "Store a text artifact in Maestro's artifact store.",
    promptSnippet: "Store a planner-visible text artifact",
    parameters: ArtifactPutParams,
    execute: (params, signal) => params.dry_run ? planned("artifact.put", params as MaestroBody) : callMaestro("/artifacts/put", { body: params as MaestroBody, signal }),
  });

  const ArtifactListParams = Type.Object({
    include_expired: OptBool(),
    filename: OptString(),
    content_type: OptString(),
    metadata_key: OptString(),
    metadata_value: OptString(),
    limit: OptInt(),
    offset: OptInt(),
  });
  registerMaestroTool(pi, {
    name: "maestro_artifact_list",
    label: "Maestro Artifact List",
    description: "List text artifact metadata from Maestro's artifact store.",
    parameters: ArtifactListParams,
    execute: (params, signal) => callMaestro(`/artifacts${queryString(params as MaestroBody)}`, { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_artifact_get",
    label: "Maestro Artifact Get",
    description: "Retrieve a text artifact from Maestro's artifact store.",
    parameters: Type.Object({ artifact_id: Type.String(), include_expired: OptBool() }),
    execute: (params, signal) => callMaestro(`/artifacts/${encodeURIComponent(params.artifact_id)}${queryString({ include_expired: params.include_expired })}`, { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_artifact_delete",
    label: "Maestro Artifact Delete",
    description: "Delete a text artifact from Maestro's artifact store.",
    parameters: Type.Object({ artifact_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/artifacts/${encodeURIComponent(params.artifact_id)}`, { method: "DELETE", signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_artifact_cleanup_expired",
    label: "Maestro Artifact Cleanup Expired",
    description: "Delete expired text artifacts from Maestro's artifact store.",
    parameters: Type.Object({ dry_run: DryRun() }),
    execute: (params, signal) => params.dry_run ? planned("artifact.cleanup_expired", params as MaestroBody) : callMaestro("/artifacts/cleanup-expired", { body: params as MaestroBody, signal }),
  });

  const AuditListParams = Type.Object({
    action: OptString(),
    destructive: OptBool(),
    status: OptString(),
    principal: OptString(),
    key_id: OptString(),
    limit: OptInt(),
    offset: OptInt(),
  });
  registerMaestroTool(pi, {
    name: "maestro_audit_list",
    label: "Maestro Audit List",
    description: "List retained Maestro audit events.",
    parameters: AuditListParams,
    execute: (params, signal) => callMaestro(`/audit${queryString(params as MaestroBody)}`, { signal }),
  });

  const TasksSubmitParams = Type.Object({
    tool: Type.String(),
    params: OptRecord(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_tasks_submit",
    label: "Maestro Tasks Submit",
    description: "Submit a Maestro tool request for managed async execution.",
    promptSnippet: "Submit a managed async Maestro task",
    parameters: TasksSubmitParams,
    execute: (params, signal) => params.dry_run ? planned("tasks.submit", params as MaestroBody) : callMaestro("/tasks", { body: params as MaestroBody, signal }),
  });

  const TasksListParams = Type.Object({
    status: OptString(),
    tool: OptString(),
    limit: OptInt(),
    offset: OptInt(),
  });
  registerMaestroTool(pi, {
    name: "maestro_tasks_list",
    label: "Maestro Tasks List",
    description: "List retained Maestro managed async tasks.",
    parameters: TasksListParams,
    execute: (params, signal) => callMaestro(`/tasks${queryString(params as MaestroBody)}`, { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_tasks_get",
    label: "Maestro Tasks Get",
    description: "Retrieve a Maestro managed async task snapshot.",
    parameters: Type.Object({ task_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/tasks/${encodeURIComponent(params.task_id)}`, { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_tasks_logs",
    label: "Maestro Tasks Logs",
    description: "Retrieve lifecycle logs for a Maestro managed async task.",
    parameters: Type.Object({ task_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/tasks/${encodeURIComponent(params.task_id)}/logs`, { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_tasks_cancel",
    label: "Maestro Tasks Cancel",
    description: "Request cancellation of a Maestro managed async task.",
    parameters: Type.Object({ task_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/tasks/${encodeURIComponent(params.task_id)}/cancel`, { method: "POST", signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_tasks_retry",
    label: "Maestro Tasks Retry",
    description: "Retry a Maestro managed async task as a new task.",
    parameters: Type.Object({ task_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/tasks/${encodeURIComponent(params.task_id)}/retry`, { method: "POST", signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_tasks_delete",
    label: "Maestro Tasks Delete",
    description: "Delete a retained Maestro managed async task.",
    parameters: Type.Object({ task_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/tasks/${encodeURIComponent(params.task_id)}`, { method: "DELETE", signal }),
  });

  const TasksCleanupParams = Type.Object({
    statuses: Nullable(Type.Array(Type.String())),
    tool: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_tasks_cleanup",
    label: "Maestro Tasks Cleanup",
    description: "Delete retained terminal Maestro task snapshots matching explicit filters.",
    parameters: TasksCleanupParams,
    execute: (params, signal) => params.dry_run ? planned("tasks.cleanup", params as MaestroBody) : callMaestro("/tasks/cleanup", { body: params as MaestroBody, signal }),
  });

  const DockerRunParams = Type.Object({
    image: Type.String(),
    command: Nullable(Type.Union([Type.String(), Type.Array(Type.String())])),
    env: Nullable(Type.Record(Type.String(), Type.String())),
    volumes: Nullable(Type.Record(Type.String(), Type.String())),
    detach: OptBool(),
    remove: OptBool(),
    name: OptString(),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_docker_run",
    label: "Maestro Docker Run",
    description: "Run a Docker container through Maestro. Server must allow Docker tooling.",
    parameters: DockerRunParams,
    execute: (params, signal) => params.dry_run ? planned("docker_run", params as MaestroBody) : callMaestro("/docker/run", { body: params as MaestroBody, signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_docker_status",
    label: "Maestro Docker Status",
    description: "Inspect a Docker container through Maestro.",
    parameters: Type.Object({ container_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/docker/${encodeURIComponent(params.container_id)}/status`, { signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_docker_logs",
    label: "Maestro Docker Logs",
    description: "Fetch Docker container logs through Maestro.",
    parameters: Type.Object({ container_id: Type.String(), tail: OptInt() }),
    execute: (params, signal) => callMaestro(`/docker/${encodeURIComponent(params.container_id)}/logs${queryString({ tail: params.tail })}`, { signal }),
  });

  const DockerExecParams = Type.Object({
    container_id: Type.String(),
    command: Type.Union([Type.String(), Type.Array(Type.String())]),
    dry_run: DryRun(),
  });
  registerMaestroTool(pi, {
    name: "maestro_docker_exec",
    label: "Maestro Docker Exec",
    description: "Execute a command in a running Docker container through Maestro.",
    parameters: DockerExecParams,
    execute: (params, signal) => {
      const { container_id, ...body } = params;
      return params.dry_run ? planned("docker_exec", params as MaestroBody) : callMaestro(`/docker/${encodeURIComponent(container_id)}/exec`, { body: body as MaestroBody, signal });
    },
  });

  registerMaestroTool(pi, {
    name: "maestro_docker_stop",
    label: "Maestro Docker Stop",
    description: "Stop a running Docker container through Maestro.",
    parameters: Type.Object({ container_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/docker/${encodeURIComponent(params.container_id)}/stop`, { method: "POST", signal }),
  });

  registerMaestroTool(pi, {
    name: "maestro_docker_remove",
    label: "Maestro Docker Remove",
    description: "Remove a Docker container through Maestro.",
    parameters: Type.Object({ container_id: Type.String() }),
    execute: (params, signal) => callMaestro(`/docker/${encodeURIComponent(params.container_id)}`, { method: "DELETE", signal }),
  });
}
