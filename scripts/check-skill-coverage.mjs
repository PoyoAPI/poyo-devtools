import {readFile} from "node:fs/promises";
import {checkGptImage25Contract} from "./check-gpt-image-2-5-contract.mjs";
import {checkH3MaxContract} from "./check-h3-max-contract.mjs";
import {checkSunoContract} from "./check-suno-contract.mjs";
import {checkMediaModelsContract} from "./check-media-models-20261012-contract.mjs";

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
checkGptImage25Contract(catalog, equal);
checkH3MaxContract(catalog, equal);
checkMediaModelsContract(catalog, equal);

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
    "4k": {with_video: 155, without_video: 251},
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
if (!equal(seedance25?.input_schema?.properties?.resolution?.enum, ["480p", "720p", "1080p", "4k"])) {
  throw new Error("Seedance 2.5 resolution enum is out of sync");
}

const geminiOmni11 = catalog.items.find((item) => item.model_id === "gemini-omni-1.1-flash");
const geminiOmni11Properties = geminiOmni11?.input_schema?.properties ?? {};
const expectedGeminiOmni11PriceTable = {
  true: {"4k": 180, standard: 120},
  false: {
    "4k": {"4": 105, "6": 120, "8": 135, "10": 150},
    standard: {"4": 45, "6": 60, "8": 75, "10": 90},
  },
};
if (
  !geminiOmni11
  || geminiOmni11.tool_name !== "poyo_gemini_omni_1_1_flash"
  || geminiOmni11.input_schema?.additionalProperties !== false
  || geminiOmni11Properties.duration?.default !== 8
  || !equal(geminiOmni11Properties.duration?.enum, [4, 6, 8, 10])
  || !equal(geminiOmni11Properties.resolution?.enum, ["360p", "720p", "1080p", "4k"])
  || geminiOmni11Properties.image_urls?.maxItems !== 2
  || geminiOmni11Properties.reference_image_urls?.maxItems !== 7
  || geminiOmni11Properties.reference_video_urls?.maxItems !== 1
  || !equal(geminiOmni11Properties.reference_video_urls?.["x-video-duration-seconds"], {
    minimum: 3,
    maximum: 10,
  })
  || ["video_start", "video_end", "audio_ids", "character_ids", "seed"].some(
    (field) => Object.hasOwn(geminiOmni11Properties, field),
  )
  || geminiOmni11.billing?.type !== "parameterized"
  || geminiOmni11.billing?.unit !== "request"
  || geminiOmni11.billing?.formula !== "price_table[has_video_input][resolution_group][duration]"
  || !equal(geminiOmni11.billing?.price_table, expectedGeminiOmni11PriceTable)
) {
  throw new Error("Gemini Omni 1.1 Flash capability is out of sync");
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
  && equal(rule.then?.properties?.mv?.enum, ["V5", "V5_5", "V6", "V6_MINI", "V6_WILD"])
));
const hasCustomRequiredRule = (schema, modeField, required) => schema.allOf?.some((rule) => (
  rule.if?.properties?.[modeField]?.const === true
  && required.every((field) => rule.then?.required?.includes(field))
));
const hasInstrumentalPromptRule = (schema, modeField) => schema.allOf?.some((rule) => (
  rule.if?.properties?.[modeField]?.const === true
  && rule.if?.properties?.instrumental?.not?.const === true
  && rule.then?.required?.includes("prompt")
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
const expectedMashupModels = ["V4", "V4_5", "V4_5ALL", "V4_5PLUS", "V5", "V5_5", "V6", "V6_MINI", "V6_WILD"];
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
  || !hasCustomRequiredRule(extendMusic, "default_param_flag", ["mv", "style", "title", "continue_at"])
  || !hasInstrumentalPromptRule(extendMusic, "default_param_flag")
  || !hasCustomRequiredRule(uploadExtend, "default_param_flag", ["mv", "style", "title", "continue_at"])
  || !equal(extendMusic.required, ["audio_id", "mv"])
  || !equal(uploadExtend.required, ["upload_url", "mv", "style", "title", "continue_at"])
  || generateMusic.properties?.custom_mode?.default !== true
  || generateMusic.properties?.instrumental?.default !== true
  || extendMusic.properties?.default_param_flag?.default !== true
  || extendMusic.properties?.instrumental?.type !== "boolean"
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

const qwenImage21 = catalog.items.find((item) => item.model_id === "qwen-image-2.1");
const qwenImage21Properties = qwenImage21?.input_schema?.properties ?? {};
if (
  qwenImage21?.tool_name !== "poyo_qwen_image_2_1"
  || qwenImage21.input_schema?.additionalProperties !== false
  || !equal(qwenImage21.billing?.resolution_credits, {"1K": 6, "2K": 10})
  || qwenImage21.billing?.formula !== "resolution_credits[resolution]"
  || qwenImage21Properties.image_urls?.maxItems !== 10
  || qwenImage21Properties.image_urls?.minItems !== 0
  || !equal(qwenImage21Properties.output_format?.enum, ["png", "webp", "jpeg"])
  || !equal(qwenImage21Properties.background?.enum, ["opaque", "transparent"])
  || qwenImage21Properties.prompt_extend?.default !== true
  || qwenImage21Properties.enable_safety_checker?.default !== true
  || !qwenImage21Properties.mask_url
  || qwenImage21.input_schema?.allOf?.length !== 3
  || ["negative_prompt", "aspect_ratio", "enhance_prompt", "nsfw_checker", "n"].some(
    (field) => Object.hasOwn(qwenImage21Properties, field),
  )
) {
  throw new Error("Qwen Image 2.1 capability is out of sync");
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
const findModel = (modelId) => catalog.items.find((item) => item.model_id === modelId);

const fable52 = findModel("claude-fable-5-2");
if (
  fable52?.tool_name !== "poyo_claude_fable_5_2"
  || fable52.billing?.type !== "token"
  || fable52.billing.input_credits !== 1280
  || fable52.billing.output_credits !== 6400
) {
  throw new Error("Claude Fable 5.2 capability is out of sync");
}

const h3Image = findModel("minimax-h3-image");
const h3ImageProperties = h3Image?.input_schema?.properties ?? {};
if (
  h3Image?.tool_name !== "poyo_minimax_h3_image"
  || h3Image.input_schema?.additionalProperties !== false
  || !equal(h3Image.billing?.resolution_credits, {"1K": 3.2, "2K": 3.2, "4K": 11.2})
  || h3Image.billing?.input_image_credits !== 0.5
  || !equal(h3ImageProperties.resolution?.enum, ["1K", "2K", "4K"])
  || h3ImageProperties.image_urls?.maxItems !== 16
  || h3ImageProperties.prompt?.maxLength !== 5000
) {
  throw new Error("MiniMax H3 Image capability is out of sync");
}

const seedream55 = findModel("seedream-5.5");
const seedream55Properties = seedream55?.input_schema?.properties ?? {};
if (
  seedream55?.tool_name !== "poyo_seedream_5_5"
  || seedream55.input_schema?.additionalProperties !== false
  || !equal(seedream55.billing?.resolution_credits, {"1K": 4, "1.5K": 4, "2K": 7})
  || seedream55.billing?.input_image_credits !== 1.6
  || !equal(seedream55Properties.resolution?.enum, ["1K", "1.5K", "2K"])
  || !equal(seedream55Properties.background?.enum, ["auto", "transparent", "opaque"])
  || seedream55Properties.image_urls?.maxItems !== 10
) {
  throw new Error("Seedream 5.5 capability is out of sync");
}

const seedream55Layerize = findModel("seedream-5.5-layerize");
const seedream55LayerizeProperties = seedream55Layerize?.input_schema?.properties ?? {};
if (
  seedream55Layerize?.tool_name !== "poyo_seedream_5_5_layerize"
  || seedream55Layerize.input_schema?.additionalProperties !== false
  || !equal(seedream55Layerize.billing?.resolution_credits, {"1K": 4, "1.5K": 4, "2K": 7, auto: 7})
  || seedream55Layerize.billing?.input_image_credits !== 1.6
  || seedream55LayerizeProperties.image_urls?.minItems !== 1
  || seedream55LayerizeProperties.image_urls?.maxItems !== 1
  || seedream55LayerizeProperties.max_images?.minimum !== 2
  || seedream55LayerizeProperties.max_images?.maximum !== 100
) {
  throw new Error("Seedream 5.5 Layerize capability is out of sync");
}

const expectedMaiImageTokenPrices = {
  "mai-image-2.6": {input: 800, image_input: 1280, output: 6080},
  "mai-image-2.6-flash": {input: 280, image_input: 400, output: 3040},
};
for (const [modelId, expected] of Object.entries(expectedMaiImageTokenPrices)) {
  const model = findModel(modelId);
  const properties = model?.input_schema?.properties ?? {};
  if (
    model?.tool_name !== `poyo_${modelId.replace(/[.-]/g, "_")}`
    || model.input_schema?.additionalProperties !== false
    || model.billing?.type !== "token"
    || !equal(model.billing?.token_credits_per_1m, expected)
    || !equal(properties.resolution?.enum, ["1K", "2K"])
    || properties.image_urls?.maxItems !== 5
    || properties.enable_web_search?.default !== false
  ) {
    throw new Error(`MAI Image 2.6 capability is out of sync: ${modelId}`);
  }
}

const seedance25Flash = findModel("seedance-2.5-flash");
const seedance25FlashProperties = seedance25Flash?.input_schema?.properties ?? {};
if (
  seedance25Flash?.tool_name !== "poyo_seedance_2_5_flash"
  || seedance25Flash.input_schema?.additionalProperties !== false
  || !equal(seedance25Flash.billing?.credit_rules, {
    "480p": {with_video: 11.5, without_video: 18.5},
    "720p": {with_video: 25.5, without_video: 41},
  })
  || !equal(seedance25FlashProperties.resolution?.enum, ["480p", "720p"])
  || seedance25FlashProperties.duration?.minimum !== 4
  || seedance25FlashProperties.duration?.maximum !== 30
  || seedance25FlashProperties.image_urls?.maxItems !== 2
  || seedance25FlashProperties.reference_image_urls?.maxItems !== 10
  || seedance25FlashProperties.reference_video_urls?.maxItems !== 5
  || seedance25FlashProperties.reference_audio_urls?.maxItems !== 5
) {
  throw new Error("Seedance 2.5 Flash capability is out of sync");
}

const expectedMaiImage27TokenPrices = {
  "mai-image-2.7": {input: 1000, image_input: 1600, output: 6800},
  "mai-image-2.7-flash": {input: 350, image_input: 500, output: 2000},
};
for (const [modelId, expected] of Object.entries(expectedMaiImage27TokenPrices)) {
  const model = findModel(modelId);
  const properties = model?.input_schema?.properties ?? {};
  if (
    model?.tool_name !== `poyo_${modelId.replace(/[.-]/g, "_")}`
    || model.input_schema?.additionalProperties !== false
    || model.billing?.type !== "token"
    || !equal(model.billing?.token_credits_per_1m, expected)
    || !equal(properties.resolution?.enum, ["1K", "2K"])
    || !equal(properties.background?.enum, ["opaque", "transparent"])
    || !equal(properties.output_format?.enum, ["png", "jpeg", "webp"])
    || properties.image_urls?.maxItems !== 5
    || properties.prompt?.maxLength !== 32000
  ) {
    throw new Error(`MAI Image 2.7 capability is out of sync: ${modelId}`);
  }
}

const kling40Image = findModel("kling-4.0-image");
const kling40ImageProperties = kling40Image?.input_schema?.properties ?? {};
if (
  kling40Image?.tool_name !== "poyo_kling_4_0_image"
  || kling40Image.input_schema?.additionalProperties !== false
  || !equal(kling40Image.billing?.resolution_credits, {"2K": 13, "4K": 19, "8K": 32})
  || kling40Image.billing?.reference_credits !== 1
  || !equal(kling40ImageProperties.resolution?.enum, ["2K", "4K", "8K"])
  || kling40ImageProperties.image_urls?.maxItems !== 10
  || kling40ImageProperties.kling_elements?.maxItems !== 7
  || kling40ImageProperties.n?.maximum !== 10
  || kling40ImageProperties.enable_sequential?.default !== false
) {
  throw new Error("Kling Image 4.0 capability is out of sync");
}

const kling40LongImage = findModel("kling-4.0-long-image");
const kling40LongImageProperties = kling40LongImage?.input_schema?.properties ?? {};
if (
  kling40LongImage?.tool_name !== "poyo_kling_4_0_long_image"
  || kling40LongImage.input_schema?.additionalProperties !== false
  || !equal(kling40LongImage.billing?.page_credits, {
    webpage: {"1K": 110, "2K": 120},
    ecommerce_short: {"1K": 47, "2K": 57},
    ecommerce_medium: {"1K": 94, "2K": 110},
    ecommerce_long: {"1K": 157, "2K": 173},
  })
  || kling40LongImage.billing?.reference_credits !== 1
  || !equal(kling40LongImageProperties.skill?.enum, ["webpage", "ecommerce"])
  || !equal(kling40LongImageProperties.length?.enum, ["short", "medium", "long"])
  || !equal(kling40LongImageProperties.resolution?.enum, ["1K", "2K"])
  || kling40LongImageProperties.image_urls?.maxItems !== 3
) {
  throw new Error("Kling Image 4.0 Long Image capability is out of sync");
}

const expectedHeygenAvatar6Rates = {
  "heygen-avatar-6": {"1080p": 20, "2K": 29},
  "heygen-avatar-6-turbo": {"1080p": 10, "2K": 18},
};
for (const [modelId, expected] of Object.entries(expectedHeygenAvatar6Rates)) {
  const model = findModel(modelId);
  const properties = model?.input_schema?.properties ?? {};
  if (
    model?.tool_name !== `poyo_${modelId.replace(/[.-]/g, "_")}`
    || model.input_schema?.additionalProperties !== false
    || model.billing?.unit !== "second"
    || !equal(model.billing?.resolution_credits_per_second, expected)
    || !equal(properties.resolution?.enum, ["1080p", "2K"])
    || !equal(properties.aspect_ratio?.enum, ["16:9", "9:16", "1:1", "4:5", "5:4"])
    || properties.image_urls?.maxItems !== 1
    || properties.text?.maxLength !== 1000
    || properties.prompt?.maxLength !== 1200
    || properties.voice?.default !== "Warm Pro Narrator"
  ) {
    throw new Error(`HeyGen Avatar 6 capability is out of sync: ${modelId}`);
  }
}

if (catalogErrors.length) throw new Error(catalogErrors.join("\n"));
process.stdout.write(`Validated ${ids.size} PoYo model capabilities.\n`);
