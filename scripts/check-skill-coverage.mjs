import {readFile} from "node:fs/promises";

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(
        ([key, item]) => [key, stable(item)],
      ),
    );
  }
  return value;
};
const equal = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));

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
    "480p": {with_video: 11.5, without_video: 20},
    "720p": {with_video: 25, without_video: 40},
    "1080p": {with_video: 62, without_video: 90},
    "4k": {with_video: 128, without_video: 200},
  },
  "seedance-2-fast": {
    "480p": {with_video: 9, without_video: 14},
    "720p": {with_video: 20, without_video: 28},
  },
  "seedance-2-mini": {
    "480p": {with_video: 6, without_video: 10},
    "720p": {with_video: 12.5, without_video: 24},
  },
};
for (const [modelId, expected] of Object.entries(expectedSeedanceRates)) {
  const model = catalog.items.find((item) => item.model_id === modelId);
  if (!equal(model?.billing?.credit_rules, expected)) {
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
    !equal(billing?.resolution_credits, expected.resolution_credits)
    || billing?.input_image_credits !== expected.input_image_credits
  ) {
    throw new Error(`Qwen Image 3 pricing is out of sync: ${modelId}`);
  }
}
process.stdout.write(`Validated ${ids.size} PoYo model capabilities.\n`);
