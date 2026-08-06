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
  if (model.billing?.type === "dynamic" && !model.billing.formula) {
    throw new Error(`Dynamic billing is missing a user-queryable formula: ${model.model_id}`);
  }
}

const expectedSeedanceRates = {
  "seedance-2": {
    false: {"480p": 20, "720p": 40, "1080p": 90, "4k": 200},
    true: {"480p": 11.5, "720p": 25, "1080p": 62, "4k": 128},
  },
  "seedance-2-fast": {
    false: {"480p": 14, "720p": 28},
    true: {"480p": 9, "720p": 20},
  },
  "seedance-2-mini": {
    false: {"480p": 10, "720p": 24},
    true: {"480p": 6, "720p": 12.5},
  },
};
for (const [modelId, expected] of Object.entries(expectedSeedanceRates)) {
  const model = catalog.items.find((item) => item.model_id === modelId);
  if (JSON.stringify(model?.billing?.price_table) !== JSON.stringify(expected)) {
    throw new Error(`Seedance pricing table is out of sync: ${modelId}`);
  }
}

const expectedQwenImageRates = {
  "qwen-image-3": {resolution_credits: {"1K": 4.8, "2K": 4.8}, input_image_credits: 0.5},
  "qwen-image-3-pro": {resolution_credits: {"1K": 6.4, "2K": 12}, input_image_credits: 0.5},
};
for (const [modelId, expected] of Object.entries(expectedQwenImageRates)) {
  const billing = catalog.items.find((item) => item.model_id === modelId)?.billing;
  if (
    JSON.stringify(billing?.resolution_credits) !== JSON.stringify(expected.resolution_credits)
    || billing?.input_image_credits !== expected.input_image_credits
  ) {
    throw new Error(`Qwen Image 3 pricing is out of sync: ${modelId}`);
  }
}
process.stdout.write(`Validated ${ids.size} PoYo model capabilities.\n`);
