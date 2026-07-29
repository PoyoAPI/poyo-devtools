import {readFile} from "node:fs/promises";
import type {Capability, JsonSchema} from "@poyoapi/core";

const RESERVED = new Set([
  "api-key", "base-url", "input", "input-file", "format", "output", "wait", "timeout", "result-limit",
  "idempotency-key", "cursor", "categories", "models", "request-source",
]);

export async function buildInput(
  capability: Capability,
  options: Record<string, string | boolean>,
): Promise<Record<string, unknown>> {
  let input: Record<string, unknown> = {};
  if (typeof options.input === "string") input = parseObject(options.input, "--input");
  if (typeof options["input-file"] === "string") input = parseObject(await readFile(options["input-file"], "utf8"), "--input-file");
  const properties = capability.input_schema.properties ?? {};
  for (const [key, value] of Object.entries(options)) {
    if (RESERVED.has(key)) continue;
    const field = key.replace(/-/g, "_");
    if (!(field in properties)) throw new Error(`Unknown option --${key} for ${capability.model_id}`);
    input[field] = coerce(value, properties[field]);
  }
  return input;
}

function parseObject(value: string, source: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error(`${source} must contain a JSON object`);
  return parsed as Record<string, unknown>;
}

function coerce(value: string | boolean, schema: JsonSchema): unknown {
  if (schema.type === "boolean") return value === true || value === "true";
  if (schema.type === "integer") return Number.parseInt(String(value), 10);
  if (schema.type === "number") return Number(value);
  if (schema.type === "array") {
    if (typeof value !== "string") return [];
    if (value.trim().startsWith("[")) return JSON.parse(value);
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return String(value);
}
