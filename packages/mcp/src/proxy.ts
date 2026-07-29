import {createInterface} from "node:readline";

export interface ProxyOptions {
  url?: string;
  apiKey?: string;
  categories?: string;
  models?: string;
}

type JsonRpcMessage = {jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown>};

export function remoteUrl(options: ProxyOptions): URL {
  const url = new URL(options.url ?? process.env.POYO_MCP_URL ?? "https://api.poyo.ai/mcp");
  const categories = options.categories ?? process.env.POYO_MCP_CATEGORIES;
  const models = options.models ?? process.env.POYO_MCP_MODELS;
  if (categories && models) throw new Error("Configure either categories or models, not both");
  if (categories) url.searchParams.set("categories", categories);
  if (models) url.searchParams.set("models", models);
  return url;
}

export async function forwardMessage(
  message: JsonRpcMessage,
  options: ProxyOptions = {},
  fetchImpl: typeof globalThis.fetch = globalThis.fetch,
  protocolVersion?: string,
): Promise<{response?: unknown; protocolVersion?: string}> {
  const apiKey = options.apiKey ?? process.env.POYO_API_KEY;
  const initializingVersion = message.method === "initialize"
    ? String((message.params as {protocolVersion?: string} | undefined)?.protocolVersion ?? "")
    : undefined;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-PoYo-Source": "mcp-stdio",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (protocolVersion && message.method !== "initialize") headers["MCP-Protocol-Version"] = protocolVersion;

  const response = await fetchImpl(remoteUrl(options), {method: "POST", headers, body: JSON.stringify(message)});
  if (response.status === 202 || message.id === undefined) {
    return {protocolVersion: initializingVersion || protocolVersion};
  }
  const text = await response.text();
  if (!response.ok) {
    return {
      response: {
        jsonrpc: "2.0",
        id: message.id ?? null,
        error: {code: -32000, message: `PoYo MCP HTTP ${response.status}`, data: text.slice(0, 2000)},
      },
      protocolVersion,
    };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = {jsonrpc: "2.0", id: message.id ?? null, error: {code: -32700, message: "Invalid JSON from remote MCP"}};
  }
  const negotiated = message.method === "initialize"
    ? String((payload as {result?: {protocolVersion?: string}})?.result?.protocolVersion ?? initializingVersion ?? protocolVersion ?? "")
    : protocolVersion;
  return {response: payload, protocolVersion: negotiated};
}

export async function runProxy(options: ProxyOptions = {}): Promise<void> {
  const input = createInterface({input: process.stdin, crlfDelay: Infinity});
  let protocolVersion: string | undefined;
  for await (const line of input) {
    if (!line.trim()) continue;
    let message: JsonRpcMessage;
    try {
      message = JSON.parse(line) as JsonRpcMessage;
    } catch {
      process.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: null, error: {code: -32700, message: "Parse error"}})}\n`);
      continue;
    }
    try {
      const result = await forwardMessage(message, options, globalThis.fetch, protocolVersion);
      protocolVersion = result.protocolVersion || protocolVersion;
      if (result.response !== undefined) process.stdout.write(`${JSON.stringify(result.response)}\n`);
    } catch (error) {
      if (message.id !== undefined) {
        process.stdout.write(`${JSON.stringify({
          jsonrpc: "2.0",
          id: message.id,
          error: {code: -32001, message: error instanceof Error ? error.message : String(error)},
        })}\n`);
      }
    }
  }
}

export function parseProxyArgs(argv: string[]): ProxyOptions {
  const options: ProxyOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === "--url") options.url = value, index += 1;
    else if (key === "--api-key") options.apiKey = value, index += 1;
    else if (key === "--categories") options.categories = value, index += 1;
    else if (key === "--models") options.models = value, index += 1;
  }
  return options;
}
