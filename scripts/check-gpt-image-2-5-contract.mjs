// 确保公开目录保持单张输出，并与确认的参数和积分表一致。
export function checkGptImage25Contract(catalog, equal) {
  const expectedFields = [
    "prompt", "image_urls", "size", "resolution", "quality",
    "background", "output_format", "mask_url",
  ].sort();
  const prices = {
    "1K": {low: 1.31, medium: 2.95, high: 10.58, xhigh: 18.76, max: 42.18},
    "2K": {low: 3.5, medium: 6.5, high: 21.48, xhigh: 38.1, max: 85.66},
    "4K": {low: 5.5, medium: 10.5, high: 35.64, xhigh: 63.28, max: 142.34},
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
      || model.billing.formula !== "price_table[billing_resolution][quality] + len(image_urls) * input_image_credits"
      || model.billing.parameters?.billing_resolution !== "Uses resolution, except custom WIDTHxHEIGHT at 2K with more than 4194304 pixels is billed at 4K. Preset aspect ratios use the requested tier."
      || model.billing.parameters?.image_urls !== "Reference image count, including repeated URLs. Defaults to an empty array; at most 16 images."
      || !equal(model.billing.price_table, prices)
      || model.billing.output_images !== 1 || model.billing.input_image_credits !== 2.5
      || model.billing.mask_credits !== 0
      || !model.examples.some((input) => input.mask_url && input.image_urls?.length)
      || !model.examples.some((input) => input.background === "transparent")
      || model.examples.some((input) => Object.keys(input).some((field) => !expectedFields.includes(field)))
    ) {
      throw new Error(`GPT Image 2.5 capability is out of sync: ${id}`);
    }
  }
}
