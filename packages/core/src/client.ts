import type {Capability, CatalogData, ClientOptions, TaskData} from "./types.js";

export class PoyoApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly detail?: unknown) {
    super(message);
    this.name = "PoyoApiError";
  }
}

export class PoyoClient {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly source: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private catalogCache?: {etag?: string; data: CatalogData};

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.POYO_INTERNAL_BASE_URL ?? "https://api.poyo.ai").replace(/\/$/, "");
    this.apiKey = options.apiKey ?? process.env.POYO_API_KEY;
    this.source = options.source ?? "cli";
    this.fetchImpl = options.fetch ?? globalThis.fetch;
  }

  async catalog(params: Record<string, string | number | undefined> = {}): Promise<CatalogData> {
    const headers: Record<string, string> = {};
    if (this.catalogCache?.etag && Object.keys(params).length === 0) headers["If-None-Match"] = this.catalogCache.etag;
    const response = await this.fetchImpl(this.url("/v1/catalog/models", {...params, limit: params.limit ?? 100}), {headers});
    if (response.status === 304 && this.catalogCache) return this.catalogCache.data;
    const payload = await this.parse<{code: number; data: CatalogData}>(response);
    if (Object.keys(params).length === 0) this.catalogCache = {etag: response.headers.get("etag") ?? undefined, data: payload.data};
    return payload.data;
  }

  async capability(model: string): Promise<Capability> {
    const response = await this.fetchImpl(this.url(`/v1/catalog/models/${encodeURIComponent(model)}`));
    return (await this.parse<{code: number; data: Capability}>(response)).data;
  }

  async submit(model: string, input: Record<string, unknown>, callbackUrl?: string): Promise<TaskData> {
    const response = await this.fetchImpl(this.url("/api/generate/submit"), {
      method: "POST",
      headers: this.authHeaders({"Content-Type": "application/json"}),
      body: JSON.stringify({model, input, ...(callbackUrl ? {callback_url: callbackUrl} : {})}),
    });
    const payload = await this.parse<{data: TaskData}>(response);
    return payload.data;
  }

  async task(taskId: string): Promise<TaskData> {
    const response = await this.fetchImpl(this.url(`/api/generate/status/${encodeURIComponent(taskId)}`), {headers: this.authHeaders()});
    const payload = await this.parse<{data: TaskData}>(response);
    return normalizeTask(payload.data);
  }

  async waitTask(taskId: string, timeoutSeconds = 90): Promise<TaskData> {
    const deadline = Date.now() + Math.max(1, timeoutSeconds) * 1000;
    while (true) {
      const task = await this.task(taskId);
      if (task.status === "succeeded" || task.status === "failed") return task;
      if (Date.now() >= deadline) throw new PoyoApiError(`Timed out waiting for task ${taskId}`, 408, task);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async chat(model: string, protocol: string, input: Record<string, unknown>, stream = false): Promise<unknown> {
    const paths: Record<string, string> = {
      "openai-chat": "/v1/chat/completions",
      "openai-responses": "/v1/responses",
      anthropic: "/v1/messages",
      gemini: `/v1beta/models/${encodeURIComponent(model)}:${stream ? "streamGenerateContent" : "generateContent"}`,
    };
    const response = await this.fetchImpl(this.url(paths[protocol] ?? paths["openai-chat"]), {
      method: "POST",
      headers: this.authHeaders({"Content-Type": "application/json", Accept: stream ? "text/event-stream" : "application/json"}),
      body: JSON.stringify({...input, model, stream}),
    });
    if (!stream) return this.parse<unknown>(response);
    if (!response.ok || !response.body) await this.parse(response);
    return response.body;
  }

  async account(): Promise<unknown> {
    const response = await this.fetchImpl(this.url("/api/user/balance"), {headers: this.authHeaders()});
    return this.parse(response);
  }

  private authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    if (!this.apiKey) throw new PoyoApiError("POYO_API_KEY is required for this command", 401);
    return {Authorization: `Bearer ${this.apiKey}`, "X-PoYo-Source": this.source, ...extra};
  }

  private url(path: string, params: Record<string, string | number | undefined> = {}): string {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    return url.toString();
  }

  private async parse<T>(response: Response): Promise<T> {
    const text = await response.text();
    let payload: unknown;
    try { payload = text ? JSON.parse(text) : undefined; } catch { payload = text; }
    if (!response.ok) {
      const detail = typeof payload === "object" && payload && "detail" in payload ? (payload as {detail: unknown}).detail : payload;
      throw new PoyoApiError(`PoYo API request failed (${response.status})`, response.status, detail);
    }
    return payload as T;
  }
}

function normalizeTask(task: TaskData): TaskData {
  const raw = String(task.status ?? "").toLowerCase();
  const status = ({pending: "queued", queued: "queued", processing: "running", running: "running", finished: "succeeded", success: "succeeded", failed: "failed"} as Record<string, string>)[raw] ?? raw;
  return {...task, raw_status: raw, status};
}
