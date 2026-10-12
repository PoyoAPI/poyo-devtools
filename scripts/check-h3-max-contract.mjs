// 校验新模型的公开参数和组合计费，防止目录同步丢失参考素材附加费。
export function checkH3MaxContract(catalog, equal) {
  const model = catalog.items.find((item) => item.model_id === "h3-max");
  const schema = model?.input_schema;
  const fields = schema?.properties ?? {};
  if (
    !model || model.status !== "stable" || model.tool_name !== "poyo_h3_max" || model.category !== "video"
    || model.execution_mode !== "async" || !model.supports_callback
    || schema.additionalProperties !== false || !equal(schema.required, ["prompt"])
    || !equal(Object.keys(fields).sort(), ["prompt", "duration", "resolution", "aspect_ratio", "image_urls", "reference_image_urls", "reference_video_urls", "reference_audio_urls", "enable_safety_checker"].sort())
    || fields.enable_safety_checker?.type !== "boolean" || fields.enable_safety_checker?.default !== true
    || fields.prompt.maxLength !== 50000 || fields.duration.minimum !== 5
    || fields.duration.maximum !== 15 || fields.duration.default !== 5
    || !equal(fields.resolution.enum, ["480p", "768p", "1080p"])
    || fields.resolution.default !== "768p" || fields.image_urls.maxItems !== 2
    || fields.reference_image_urls.maxItems !== 9 || fields.reference_video_urls.maxItems !== 3
    || fields.reference_audio_urls.maxItems !== 3 || schema.allOf?.length !== 4
    || model.billing.type !== "parameterized" || model.billing.unit !== "request"
    || model.billing.formula !== "duration * resolution_credits_per_second[resolution] + max(0, reference_tokens - free_reference_tokens) * reference_credits_per_1000_tokens / 1000"
    || !equal(model.billing.resolution_credits_per_second, {"480p": 10, "768p": 16, "1080p": 32})
    || model.billing.free_reference_tokens !== 4096 || model.billing.reference_credits_per_1000_tokens !== 4
    || !model.examples.some((input) => input.image_urls?.length)
    || !model.examples.some((input) => input.reference_image_urls?.length && input.reference_video_urls?.length && input.reference_audio_urls?.length)
  ) throw new Error("H3 Max capability is out of sync");
}
