import {mkdir, writeFile} from "node:fs/promises";

const baseUrl = (process.env.POYO_INTERNAL_BASE_URL ?? "https://api.poyo.ai").replace(/\/$/, "");
let cursor: string | null = null;
let schemaVersion: string | null = null;
const items: unknown[] = [];

do {
  const url = new URL(`${baseUrl}/v1/catalog/models`);
  url.searchParams.set("limit", "100");
  if (cursor) url.searchParams.set("cursor", cursor);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  const payload = await response.json() as {
    data?: {
      schema_version?: string;
      items?: unknown[];
      next_cursor?: string | null;
    };
  };
  if (!payload.data?.schema_version || !Array.isArray(payload.data.items)) {
    throw new Error("Catalog response is missing schema_version or items");
  }
  if (schemaVersion && schemaVersion !== payload.data.schema_version) {
    throw new Error("Catalog schema changed while synchronizing pages");
  }
  schemaVersion = payload.data.schema_version;
  items.push(...payload.data.items);
  cursor = payload.data.next_cursor ?? null;
} while (cursor);

await mkdir("artifacts", {recursive: true});
await writeFile(
  "artifacts/capability-catalog.json",
  `${JSON.stringify({schema_version: schemaVersion, items, next_cursor: null, has_more: false}, null, 2)}\n`,
  "utf8",
);
