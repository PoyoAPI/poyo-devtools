---
name: poyo-ai-models
description: Discover, price, and execute PoYo chat, media-generation, and content-moderation models through PoYo MCP or CLI. Use when Codex needs to choose a PoYo model, inspect its input schema, run non-streaming chat, stream chat through the CLI, submit image/video/audio/3D generation or content moderation, poll a task, or report credits and failures.
---

# PoYo AI Models

Use the production Capability Catalog as the source of truth. Never invent model IDs or parameters.

## Choose the integration

1. Prefer hosted MCP at `https://api.poyo.ai/mcp`.
2. After discovery, prefer `?models=MODEL_A,MODEL_B` when a small strongly typed tool set is useful. Use `?categories=...` only for bounded exploration, and never combine both filters.
3. Use `npx @poyoapi/mcp` for clients that only support stdio.
4. Use `npx @poyoapi/cli` for chat SSE or when MCP is unavailable.
5. Mark Skill executions with `_request_source: "skill"` in MCP or `--request-source skill` in CLI.

Keep `POYO_API_KEY` in the environment or system keyring. Never put it in prompts, query strings, committed files, or retained shell history.

Inspect `tools/list` on the selected connection before calling a tool. A filtered connection exposes model-specific tools and `poyo_check_job`; generic execution tools such as `poyo_submit_job` are available on the unfiltered `/mcp` connection. The same rule applies to stdio `--models` and `--categories` filters.

## Execute

1. Restate the desired modality, model constraints, inputs, output requirements, and budget.
2. Search the catalog and inspect the selected model's schema and pricing.
3. Validate every input against that schema.
4. For chat, use the model-specific tool on a filtered connection or `poyo_chat` on the unfiltered connection; use CLI `poyo chat MODEL --stream` only when incremental output is required.
5. For generation or moderation on a filtered connection, call the model-specific tool with `_wait_seconds: 0` for video, 3D, music, or other long work. On the unfiltered connection, use `poyo_submit_job` for long work or `poyo_run_model` for short generation. Never call a generic execution tool that is absent from `tools/list`.
6. Treat queued and running as incomplete. Poll with `poyo_check_job` until succeeded or failed.
7. Report model ID, final status, credits, output URLs or structured output, and any partial or failed result.

Read the generated reference matching the requested category when it exists in `references/`.

For Flux 3 Klein generation or editing, also read `references/flux-3-klein.md` for reference images, resolution tiers, exact pixel sizes, and safety checking. For Flux 3 Max, read `references/flux-3-max.md` to select text, starting/ending-image, or positioned-keyframe video generation. Submit only user-selected fields; do not inject defaults.

For Omni Moderation, read `references/moderation.md`. Reviews run in the background and cost 0 credits. Provide a non-empty `prompt`, one HTTPS image URL in `image_urls`, or both. `image_urls` remains an array with at most one image; submit additional images as separate tasks. Base64 and data URLs are unsupported. On filtered MCP, use `poyo_omni_moderation_latest` with `_wait_seconds: 0`, then poll `poyo_check_job`. On unfiltered MCP, use `poyo_run_model` for short waits or `poyo_submit_job` with optional top-level `callback_url`. For CLI polling, use `poyo run omni-moderation-latest --prompt "Text to review" --format json --request-source skill`; for callbacks, use `poyo submit omni-moderation-latest --prompt "Text to review" --callback-url "https://example.com/moderation-callback" --format json --request-source skill`. Keep `callback_url` outside model input; filtered tools and `poyo_run_model` continue through polling. Keep the single image URL inside the `image_urls` array. Read the complete OpenAI moderation response from `output`; a flagged result is a successful review. Report category flags and scores. Streaming is unsupported.

For every Suno model or workflow, also read `references/suno.md` before validating inputs or submitting a task.

For GPT Image 2.5 Flare or Sunburst, also read `references/gpt-image-2-5.md` for single-image inputs, aspect-ratio versus exact-pixel sizes, and mask editing examples.

For H3 Max, read `references/h3-max.md` for mode selection, reference limits, and server-calculated reference charges. Check live availability before submitting. Both H3 models accept the optional boolean `enable_safety_checker` (default `true`); use `--enable-safety-checker false` in CLI or `enable_safety_checker: false` in MCP to disable it when requested. Omit it unless the user selects a value.

For `h3-max-turbo`, omit `image_urls` or pass `[]` for text-to-video; one image sets the first frame, and two set the first and last frames. Omit `aspect_ratio` when using images. Only `prompt`, `duration`, `resolution`, `aspect_ratio`, `image_urls`, and `enable_safety_checker` are supported; reference media, seed, custom audio, and prompt-expansion controls are unavailable. Always describe the model before submitting.

For Qwen Image 2.1, also read `references/qwen-image-2-1.md` for reference images, transparent backgrounds, and mask editing constraints.

For Seedream 5.0 Flash, also read `references/seedream-5-0-flash.md` for text generation, editing references, and the `size` versus `resolution` mapping.

For Nano Banana 2.1, also read `references/nano-banana-2-1.md` for its shared image parameters and single model ID for generation and editing.

For Ideogram V4.5 generation or editing, read `references/ideogram-v4-5.md` for primary images, references, mask limits, and precision-dependent sizes.

For ElevenLabs V4, V4 Turbo, or Gemini 3.8 speech, read `references/speech-v4-gemini-3-8.md` for original audio formats and mutually exclusive transcript/dialogue inputs. Send structured dialogue arrays through JSON or CLI `--input-file`.

For Meshy 7.1, read `references/meshy-7-1.md` for text/image/multi-image selection, topology limits, and rigging requirements. Omit optional values unless the user chooses them.

For Vidu Q4, read `references/vidu-q4.md` for starting-frame and reference-image modes; images are required, and reference audio must accompany reference images. For OmniHuman 2.0, read `references/omnihuman-2-0.md` for image/audio inputs and final output-duration billing. Supply only user-selected fields; omit seed and internal timing or billing fields.

For Kling 4.0, read `references/kling-4-0.md` for reference images, reference videos, and video-duration billing. Use only the public reference fields; submit only user-selected values and let the server probe video durations.

## Guardrails

- Check account credits before expensive or repeated generation.
- Do not automatically resubmit a paid request after a timeout or transport failure; first determine whether a task was created.
- Do not claim completion while a task is queued or running.
- Do not pass `stream: true` to MCP chat; MCP returns one complete tool result.
- Preserve task IDs so interrupted work can resume without resubmission.
