export function checkSunoContract(catalog, equal) {
  const expectedCredits = {
    "generate-mashup": 12,
    "generate-sounds": 2.5,
    "suno-voice-validate": 0,
    "suno-voice-generate": 0,
    "suno-voice-regenerate": 0,
    "suno-voice-check": 0,
  };
  const byId = new Map(catalog.items.map((item) => [item.model_id, item]));
  if (byId.has("stem-split-advanced")) {
    throw new Error("Disabled Suno public model is still exposed: stem-split-advanced");
  }
  for (const [modelId, credits] of Object.entries(expectedCredits)) {
    const model = byId.get(modelId);
    const category = modelId === "generate-sounds" ? "text2audio" : "audio2audio";
    if (
      !model || model.billing?.type !== "fixed" || model.billing?.credits !== credits
      || model.category !== category || model.tool_name !== `poyo_${modelId.replaceAll("-", "_")}`
    ) {
      throw new Error(`Suno model or pricing is out of sync: ${modelId}`);
    }
  }

  const schema = (modelId) => byId.get(modelId)?.input_schema ?? {};
  const props = (modelId) => schema(modelId).properties ?? {};
  const hasCustomRequired = (modelId, fields) => schema(modelId).allOf?.some((rule) => (
    rule.if?.properties?.default_param_flag?.const === true
    && fields.every((field) => rule.then?.required?.includes(field))
  ));
  const generateMusic = schema("generate-music");
  const extend = props("extend-music");
  const uploadCover = props("upload-and-cover-audio");
  if (
    props("generate-mashup").upload_url_list?.minItems !== 2
    || props("generate-mashup").upload_url_list?.maxItems !== 2
    || props("generate-sounds").sound_tempo?.minimum !== 1
    || props("generate-sounds").sound_tempo?.maximum !== 300
    || props("suno-voice-validate").voice_url?.pattern !== "^https?://"
    || props("suno-voice-generate").verify_url?.pattern !== "^https?://"
    || extend.prompt?.maxLength !== 5000
    || extend.style?.maxLength !== 1000
    || extend.title?.maxLength !== 100
    || uploadCover.prompt?.maxLength !== 5000
    || uploadCover.style?.maxLength !== 1000
    || uploadCover.title?.maxLength !== 100
    || !equal(schema("extend-music").required, ["audio_id"])
    || !equal(schema("upload-and-extend-audio").required, ["upload_url"])
    || !hasCustomRequired("extend-music", ["mv", "prompt", "style", "title", "continue_at"])
    || !hasCustomRequired("upload-and-extend-audio", ["mv", "style", "title", "continue_at"])
    || !generateMusic.allOf?.some((rule) => (
      rule.if?.properties?.custom_mode?.const === false
      && rule.then?.properties?.prompt?.maxLength === 3000
    ))
    || props("generate-persona").name?.pattern !== "\\S"
    || props("generate-persona").task_id?.description !== "Unique identifier of a completed Generate Music or Extend Music task."
    || props("replace-section").full_lyrics?.pattern !== "\\S"
    || !props("replace-section").infill_start_s?.description?.includes("at least 10 seconds")
  ) {
    throw new Error("Suno capability fields are out of sync");
  }
}
