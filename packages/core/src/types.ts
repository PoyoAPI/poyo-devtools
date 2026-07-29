export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  [key: string]: unknown;
}

export type RequestSource = "cli" | "skill-cli" | "mcp-stdio" | "mcp-remote";

export interface Capability {
  model_id: string;
  tool_name: string;
  vendor_code: string;
  service_type: "chat" | "generate";
  category: string;
  title: string;
  description: string;
  tags: string[];
  input_schema: JsonSchema;
  output_schema: JsonSchema;
  examples: Array<Record<string, unknown>>;
  supported_protocols: string[];
  execution_mode: "sync" | "async";
  supports_streaming: boolean;
  supports_callback: boolean;
  billing: Record<string, unknown>;
  status: string;
}

export interface CatalogData {
  schema_version: string;
  items: Capability[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface TaskData {
  task_id: string;
  status: string;
  raw_status?: string;
  files?: unknown[];
  output?: unknown;
  error_message?: string | null;
  credits_amount?: number;
  created_time?: string;
  finished_time?: string | null;
}

export interface ClientOptions {
  baseUrl?: string;
  apiKey?: string;
  source?: RequestSource;
  fetch?: typeof globalThis.fetch;
}
