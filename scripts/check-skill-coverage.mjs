import {readFile} from "node:fs/promises";

const catalog = JSON.parse(await readFile("artifacts/capability-catalog.json", "utf8"));
if (!catalog.items?.length) throw new Error("Capability Catalog contains no models");
const ids = new Set();
for (const model of catalog.items) {
  if (!model.model_id || ids.has(model.model_id)) throw new Error(`Invalid or duplicate model_id: ${model.model_id}`);
  ids.add(model.model_id);
  if ([model.model_id, model.title].some((value) => typeof value === "string" && value.toLowerCase().includes("vip"))) {
    throw new Error(`Catalog exposes a VIP model: ${model.model_id}`);
  }
  if (Object.hasOwn(model, "vendor_code")) throw new Error(`Catalog exposes vendor_code: ${model.model_id}`);
  if (!model.input_schema || !model.output_schema) throw new Error(`Missing schema: ${model.model_id}`);
  if (!model.examples?.length) throw new Error(`Missing examples: ${model.model_id}`);
}
process.stdout.write(`Validated ${ids.size} PoYo model capabilities.\n`);
