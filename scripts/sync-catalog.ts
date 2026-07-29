import {mkdir, writeFile} from "node:fs/promises";

const baseUrl = (process.env.POYO_BASE_URL ?? "https://api.poyo.ai").replace(/\/$/, "");
const response = await fetch(`${baseUrl}/v1/catalog/models?limit=100`);
if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
const payload = await response.json();
await mkdir("artifacts", {recursive: true});
await writeFile("artifacts/capability-catalog.json", `${JSON.stringify(payload.data, null, 2)}\n`, "utf8");
