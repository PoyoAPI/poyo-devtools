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
  "seedance-2.5": {
    "480p": {with_video: 17, without_video: 28},
    "720p": {with_video: 38, without_video: 63},
    "1080p": {with_video: 68.5, without_video: 114},
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

const seedance25 = catalog.items.find((item) => item.model_id === "seedance-2.5");
if (!equal(seedance25?.input_schema?.properties?.resolution?.enum, ["480p", "720p", "1080p"])) {
  throw new Error("Seedance 2.5 resolution enum is out of sync");
}

const expectedWan30Rates = {
  "wan3.0-text-to-video": {"480p": 10, "720p": 20, "1080p": 40},
  "wan3.0-image-to-video": {"480p": 10, "720p": 20, "1080p": 40},
  "wan3.0-reference-to-video": {"480p": 10, "720p": 20, "1080p": 40},
  "wan3.0-prime-text-to-video": {"480p": 13.6, "720p": 28, "1080p": 56},
  "wan3.0-prime-image-to-video": {"480p": 13.6, "720p": 28, "1080p": 56},
  "wan3.0-prime-reference-to-video": {"480p": 13.6, "720p": 28, "1080p": 56},
};
for (const [modelId, expected] of Object.entries(expectedWan30Rates)) {
  const model = catalog.items.find((item) => item.model_id === modelId);
  const properties = model?.input_schema?.properties ?? {};
  if (
    model?.billing?.type !== "tiered"
    || model.billing.unit !== "second"
    || !equal(model.billing.resolution_credits, expected)
    || properties.audio?.type !== "boolean"
    || Object.hasOwn(properties, "generate_audio")
  ) {
    throw new Error(`Wan 3.0 capability is out of sync: ${modelId}`);
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

const grokImage20 = catalog.items.find((item) => item.model_id === "grok-imagine-image-2.0");
const grokImage20Properties = grokImage20?.input_schema?.properties ?? {};
const grokImageQuality = catalog.items.find((item) => item.model_id === "grok-imagine-image-quality");
const grokImageQualityProperties = grokImageQuality?.input_schema?.properties ?? {};
const expectedGrokImageAspectRatios = ["1:1", "2:3", "3:2", "9:16", "16:9"];
const expectedGrokImage20Prices = {
  "1K": {low: 8, medium: 12},
  "2K": {low: 12, medium: 16},
};
if (
  !grokImage20
  || !equal(grokImage20Properties.quality?.enum, ["low", "medium"])
  || grokImage20Properties.n?.maximum !== 4
  || grokImage20Properties.image_urls?.maxItems !== 3
  || !equal(grokImage20Properties.aspect_ratio?.enum, expectedGrokImageAspectRatios)
  || Object.hasOwn(grokImage20Properties, "output_format")
  || Object.hasOwn(grokImage20Properties, "sync_mode")
  || !equal(grokImage20.billing?.price_table, expectedGrokImage20Prices)
  || grokImage20.billing?.input_image_credits !== 2
) {
  throw new Error("Grok Imagine Image 2.0 capability is out of sync");
}
if (
  !grokImageQuality
  || !equal(grokImageQualityProperties.aspect_ratio?.enum, expectedGrokImageAspectRatios)
  || Object.hasOwn(grokImageQualityProperties, "output_format")
  || Object.hasOwn(grokImageQualityProperties, "sync_mode")
) {
  throw new Error("Grok Imagine Image Quality capability is out of sync");
}
process.stdout.write(`Validated ${ids.size} PoYo model capabilities.\n`);
