// 检查新增模型的公开参数、计费描述和 Skill 入口是否同步。
export function checkMediaModelsContract(catalog, equal) {
  const ids = [
    "ideogram-v4.5", "ideogram-v4.5-edit", "elevenlabs-v4-tts", "elevenlabs-v4-turbo-tts",
    "gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "meshy-7.1-text-to-3d",
    "meshy-7.1-image-to-3d", "meshy-7.1-multi-image-to-3d",
  ];
  for (const id of ids) {
    const model = catalog.items.find((item) => item.model_id === id);
    const p = model?.input_schema?.properties ?? {};
    if (!model || model.tool_name !== `poyo_${id.replace(/[^a-z0-9]+/g, "_")}`
      || model.input_schema.additionalProperties !== false || model.execution_mode !== "async"
      || !model.supports_callback || model.billing.type !== "parameterized"
      || Object.hasOwn(p, "sync_mode") || Object.hasOwn(p, "submit_uri")) {
      throw new Error(`Media capability is out of sync: ${id}`);
    }
    if (id.startsWith("ideogram")) {
      const prices = {low: 6, medium: 12, high: 44, ...(id.endsWith("edit") ? {very_low: 1.6} : {})};
      if (p.n.minimum !== 1 || p.n.maximum !== 8 || p.quality.default !== "medium"
        || Object.hasOwn(p, "seed") || Object.hasOwn(p, "enable_prompt_expansion")
        || !equal(model.billing.quality_credits, prices)
        || (id.endsWith("edit") ? p.image_urls.maxItems !== 1 || model.input_schema.allOf.length !== 2 : p.size.enum.length !== 42)) {
        throw new Error(`Ideogram contract is out of sync: ${id}`);
      }
    } else if (id.startsWith("elevenlabs")) {
      if (p.text.maxLength !== 5000 || p.output_format.enum.length !== 19 || Object.hasOwn(p, "seed")
        || model.billing.credits_per_1000_characters !== (id.includes("turbo") ? 8 : 16)) {
        throw new Error(`Speech format contract is out of sync: ${id}`);
      }
    } else if (id.startsWith("gemini")) {
      if (p.speakers.minItems !== 2 || p.speakers.maxItems !== 2 || p.turns.minItems !== 1
        || model.input_schema.oneOf.length !== 2 || Object.hasOwn(p, "output_format")
        || model.billing.credits_per_1000_characters !== (id.includes("lite") ? 6 : 9)
        || !model.examples.some((example) => example.speakers && example.turns)) {
        throw new Error(`Dialogue contract is out of sync: ${id}`);
      }
    } else {
      if (model.billing.base_credits !== 160 || model.billing.texture_credits !== 80
        || model.billing.rigging_credits !== 40 || model.billing.animation_credits !== 24
        || p.animation_action_id.default !== 92
        || (id.includes("multi") && (p.image_urls.maxItems !== 4 || Object.hasOwn(p, "model_type")
          || !equal(p.geometry_resolution.enum, ["standard", "2k"])))) {
        throw new Error(`3D contract is out of sync: ${id}`);
      }
    }
  }
}
