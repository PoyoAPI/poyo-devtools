import {readFile} from "node:fs/promises";
import {checkSunoContract} from "./check-suno-contract.mjs";

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
const catalogErrors = [];
for (const model of catalog.items) {
  if (!model.model_id || ids.has(model.model_id)) catalogErrors.push(`Invalid or duplicate model_id: ${model.model_id}`);
  ids.add(model.model_id);
  if ([model.model_id, model.title].some((value) => typeof value === "string" && value.toLowerCase().includes("vip"))) {
    catalogErrors.push(`Catalog exposes a VIP model: ${model.model_id}`);
  }
  if (Object.hasOwn(model, "vendor_code")) catalogErrors.push(`Catalog exposes vendor_code: ${model.model_id}`);
  if (!model.input_schema || !model.output_schema) catalogErrors.push(`Missing schema: ${model.model_id}`);
  if (!model.examples?.length) catalogErrors.push(`Missing examples: ${model.model_id}`);
  if (model.billing?.type === "dynamic" && !model.billing.formula) {
    catalogErrors.push(`Dynamic billing is missing a user-queryable formula: ${model.model_id}`);
  }
}
checkSunoContract(catalog, equal);

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

const expectedSunoCredits = {
  "generate-mashup": 12,
  "generate-sounds": 2.5,
  "stem-split-advanced": 20,
  "suno-voice-validate": 0,
  "suno-voice-generate": 0,
  "suno-voice-regenerate": 0,
  "suno-voice-check": 0,
};
for (const [modelId, credits] of Object.entries(expectedSunoCredits)) {
  const model = catalog.items.find((item) => item.model_id === modelId);
  const expectedCategory = modelId === "generate-sounds" ? "text2audio" : "audio2audio";
  const expectedToolName = `poyo_${modelId.replaceAll("-", "_")}`;
  if (
    !model || model.billing?.type !== "fixed" || model.billing?.credits !== credits
    || model.category !== expectedCategory || model.tool_name !== expectedToolName
  ) {
    throw new Error(`Suno model or pricing is out of sync: ${modelId}`);
  }
}
const mashup = catalog.items.find((item) => item.model_id === "generate-mashup")?.input_schema?.properties ?? {};
const sounds = catalog.items.find((item) => item.model_id === "generate-sounds")?.input_schema?.properties ?? {};
const advancedStem = catalog.items.find((item) => item.model_id === "stem-split-advanced")?.input_schema ?? {};
const replaceSection = catalog.items.find((item) => item.model_id === "replace-section")?.input_schema ?? {};
const separateVocals = catalog.items.find((item) => item.model_id === "separate-vocals")?.input_schema ?? {};
const stemSplit = catalog.items.find((item) => item.model_id === "stem-split")?.input_schema ?? {};
const voiceCheck = catalog.items.find((item) => item.model_id === "suno-voice-check");
const voiceValidate = catalog.items.find((item) => item.model_id === "suno-voice-validate")?.input_schema?.properties ?? {};
const voiceValidateOutput = catalog.items.find((item) => item.model_id === "suno-voice-validate")?.output_schema?.properties ?? {};
const voiceGenerate = catalog.items.find((item) => item.model_id === "suno-voice-generate")?.input_schema?.properties ?? {};
const voiceGenerateOutput = catalog.items.find((item) => item.model_id === "suno-voice-generate")?.output_schema?.properties ?? {};
const voiceCheckOutput = voiceCheck?.output_schema?.properties ?? {};
const generateMusic = catalog.items.find((item) => item.model_id === "generate-music")?.input_schema ?? {};
const extendMusic = catalog.items.find((item) => item.model_id === "extend-music")?.input_schema ?? {};
const uploadCover = catalog.items.find((item) => item.model_id === "upload-and-cover-audio")?.input_schema ?? {};
const uploadExtend = catalog.items.find((item) => item.model_id === "upload-and-extend-audio")?.input_schema ?? {};
const generatePersona = catalog.items.find((item) => item.model_id === "generate-persona")?.input_schema ?? {};
const hasPersonaCustomRule = (schema, modeField) => schema.allOf?.some((rule) => (
  rule.if?.required?.includes("persona_id")
  && rule.then?.properties?.[modeField]?.const === true
  && equal(rule.then?.properties?.mv?.enum, ["V5", "V5_5"])
));
const hasCustomRequiredRule = (schema, modeField, required) => schema.allOf?.some((rule) => (
  rule.if?.properties?.[modeField]?.const === true
  && required.every((field) => rule.then?.required?.includes(field))
));
const hasLimitRule = (schema, modeField, modeValue, mvValue, limits) => schema.allOf?.some((rule) => (
  rule.if?.properties?.[modeField]?.const === modeValue
  && (
    rule.if?.properties?.mv?.const === mvValue
    || rule.if?.properties?.mv?.enum?.includes(mvValue)
  )
  && Object.entries(limits).every(([field, maxLength]) => (
    rule.then?.properties?.[field]?.maxLength === maxLength
  ))
));
const expectedSoundKeys = [
  "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm",
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
const expectedMashupModels = ["V4", "V4_5", "V4_5ALL", "V4_5PLUS", "V5", "V5_5"];
if (
  mashup.upload_url_list?.minItems !== 2 || mashup.upload_url_list?.maxItems !== 2
  || mashup.upload_url_list?.items?.pattern !== "^https?://"
  || !equal(mashup.mv?.enum, expectedMashupModels)
  || mashup.custom_mode?.default !== true || mashup.instrumental?.default !== true
  || mashup.style_weight?.multipleOf !== 0.01
  || mashup.weirdness_constraint?.multipleOf !== 0.01
  || mashup.audio_weight?.multipleOf !== 0.01
  || mashup.prompt?.minLength !== 1
  || sounds.prompt?.minLength !== 1
  || mashup.duration?.minimum !== 10 || mashup.duration?.maximum !== 360
  || sounds.sound_tempo?.minimum !== 1 || sounds.sound_tempo?.maximum !== 300
  || sounds.sound_loop?.default !== false || sounds.grab_lyrics?.default !== false
  || !equal(sounds.sound_key?.enum, expectedSoundKeys)
  || advancedStem.properties?.upload_url?.pattern !== "^https?://" || advancedStem.properties?.stem_name?.pattern !== "\\S" || !advancedStem.oneOf
  || replaceSection.properties?.upload_url?.pattern !== "^https?://" || !replaceSection.properties?.mv || !replaceSection.oneOf
  || replaceSection.properties?.infill_start_s?.multipleOf !== 0.01
  || replaceSection.properties?.infill_end_s?.multipleOf !== 0.01
  || separateVocals.properties?.upload_url?.pattern !== "^https?://" || !separateVocals.oneOf
  || stemSplit.properties?.upload_url?.pattern !== "^https?://" || !stemSplit.oneOf
  || voiceValidate.voice_url?.pattern !== "^https?://" || !voiceValidate.vocal_start_s || !voiceValidate.vocal_end_s
  || voiceValidate.language?.default !== "en"
  || !equal(voiceValidateOutput.validate_info?.type, ["string", "null"])
  || !voiceValidateOutput.error_message || !voiceValidateOutput.error_code
  || !voiceGenerate.task_id || voiceGenerate.verify_url?.pattern !== "^https?://"
  || !equal(voiceGenerateOutput.voice_id?.type, ["string", "null"])
  || !equal(voiceGenerateOutput.voice_status?.type, ["string", "null"])
  || voiceCheckOutput.is_available?.type !== "boolean"
  || voiceCheck?.execution_mode !== "async" || voiceCheck?.supports_callback !== true
  || !hasPersonaCustomRule(generateMusic, "custom_mode")
  || !hasPersonaCustomRule(uploadCover, "custom_mode")
  || !hasPersonaCustomRule(extendMusic, "default_param_flag")
  || !hasPersonaCustomRule(uploadExtend, "default_param_flag")
  || !hasCustomRequiredRule(extendMusic, "default_param_flag", ["mv", "prompt", "style", "title", "continue_at"])
  || !hasCustomRequiredRule(uploadExtend, "default_param_flag", ["mv", "style", "title", "continue_at"])
  || !equal(extendMusic.required, ["audio_id"])
  || !equal(uploadExtend.required, ["upload_url"])
  || generateMusic.properties?.custom_mode?.default !== true
  || generateMusic.properties?.instrumental?.default !== true
  || extendMusic.properties?.default_param_flag?.default !== true
  || uploadCover.properties?.upload_url?.pattern !== "^https?://"
  || uploadExtend.properties?.upload_url?.pattern !== "^https?://"
  || !hasLimitRule(generateMusic, "custom_mode", true, "V4", {prompt: 3000, style: 200, title: 80})
  || !hasLimitRule(generateMusic, "custom_mode", true, "V5_5", {prompt: 5000, style: 1000, title: 80})
  || !generateMusic.allOf?.some((rule) => rule.if?.properties?.custom_mode?.const === false && rule.then?.properties?.prompt?.maxLength === 3000)
  || !hasLimitRule(uploadCover, "custom_mode", true, "V5_5", {prompt: 5000, style: 1000, title: 100})
  || !hasLimitRule(extendMusic, "default_param_flag", true, "V4_5ALL", {prompt: 5000, style: 1000, title: 80})
  || !hasLimitRule(uploadExtend, "default_param_flag", true, "V5", {prompt: 5000, style: 1000, title: 100})
  || !equal(generatePersona.dependentRequired, {vocal_start: ["vocal_end"], vocal_end: ["vocal_start"]})
  || generatePersona.properties?.name?.pattern !== "\\S"
  || replaceSection.properties?.full_lyrics?.pattern !== "\\S"
  || uploadExtend.properties?.continue_at?.exclusiveMinimum !== 0
  || !uploadExtend.properties?.prompt?.description?.startsWith("Optional")
) {
  throw new Error("Suno capability fields are out of sync");
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
if (catalogErrors.length) throw new Error(catalogErrors.join("\n"));
process.stdout.write(`Validated ${ids.size} PoYo model capabilities.\n`);
