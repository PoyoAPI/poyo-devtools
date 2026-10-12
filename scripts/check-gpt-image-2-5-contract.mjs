// 确保公开目录保持单张输出，并与确认的参数和积分表一致。
export function checkGptImage25Contract(catalog, equal) {
  const expectedFields = [
    "prompt", "image_urls", "size", "resolution", "quality",
    "background", "output_format", "mask_url",
  ].sort();
  const prices = {
    "1K": {low: 1.31, medium: 2.95, high: 11.78, xhigh: 20.93, max: 47.11},
    "2K": {low: 2.65, medium: 5.99, high: 23.94, xhigh: 42.55, max: 95.74},
    "4K": {low: 2.47, medium: 5.81, high: 22.39, xhigh: 39.78, max: 89.51},
  };
  for (const variant of ["flare", "sunburst"]) {
    const id = `gpt-image-2.5-${variant}`;
    const model = catalog.items.find((item) => item.model_id === id);
    const properties = model?.input_schema?.properties ?? {};
    if (
      !model || model.tool_name !== `poyo_gpt_image_2_5_${variant}`
      || model.category !== "image" || model.execution_mode !== "async" || !model.supports_callback
      || model.input_schema.additionalProperties !== false
      || !equal(model.input_schema.required, ["prompt"])
      || !equal(Object.keys(properties).sort(), expectedFields)
      || properties.prompt.maxLength !== 32000 || properties.image_urls.maxItems !== 16
      || properties.size.default !== "1:1" || properties.resolution.default !== "1K"
      || properties.quality.default !== "high" || properties.background.default !== "auto"
      || properties.output_format.default !== "png"
      || !equal(properties.quality.enum, ["low", "medium", "high", "xhigh", "max"])
      || !equal(properties.resolution.enum, ["1K", "2K", "4K"])
      || !equal(properties.background.enum, ["auto", "transparent", "opaque"])
      || !equal(properties.output_format.enum, ["png", "jpeg", "webp"])
      || model.billing.type !== "parameterized" || model.billing.unit !== "image"
      || model.billing.formula !== "price_table[resolution][quality]"
      || !equal(model.billing.price_table, prices)
      || model.billing.output_images !== 1 || model.billing.input_image_credits !== 0
      || model.billing.mask_credits !== 0
      || !model.examples.some((input) => input.mask_url && input.image_urls?.length)
      || !model.examples.some((input) => input.background === "transparent")
      || model.examples.some((input) => Object.keys(input).some((field) => !expectedFields.includes(field)))
    ) {
      throw new Error(`GPT Image 2.5 capability is out of sync: ${id}`);
    }
  }
}
