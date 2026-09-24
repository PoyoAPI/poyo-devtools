---
name: poyo-ai-models
description: Discover, price, and execute PoYo chat and media-generation models through PoYo MCP or CLI. Use when Codex needs to choose a PoYo model, inspect its input schema, run non-streaming chat, stream chat through the CLI, submit image/video/audio/3D generation, poll a task, or report credits and failures.
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

## Execute

1. Restate the desired modality, model constraints, inputs, output requirements, and budget.
2. Search the catalog and inspect the selected model's schema and pricing.
3. Validate every input against that schema.
4. For chat, use `poyo_chat`; use CLI `poyo chat MODEL --stream` only when incremental output is required.
5. For short generation, use `poyo_run_model`. For video, 3D, music, or other long work, use `poyo_submit_job`.
6. Treat queued and running as incomplete. Poll with `poyo_check_job` until succeeded or failed.
7. Report model ID, final status, credits, output URLs, and any partial or failed result.

Read the generated reference matching the requested category when it exists in `references/`.
For every Suno model or workflow, also read `references/suno.md` before validating inputs or submitting a task.

For GPT Image 2.5 Flare or Sunburst, also read `references/gpt-image-2-5.md` for single-image inputs, aspect-ratio versus exact-pixel sizes, and mask editing examples.

For H3 Max, read `references/h3-max.md` for mode selection, reference limits, and server-calculated reference charges. Check live availability before submitting. Both H3 models accept the optional boolean `enable_safety_checker` (default `true`); use `--enable-safety-checker false` in CLI or `enable_safety_checker: false` in MCP to disable it when requested. Omit it unless the user selects a value.

For `h3-max-turbo`, omit `image_urls` or pass `[]` for text-to-video; one image sets the first frame, and two set the first and last frames. Omit `aspect_ratio` when using images. Only `prompt`, `duration`, `resolution`, `aspect_ratio`, `image_urls`, and `enable_safety_checker` are supported; reference media, seed, custom audio, and prompt-expansion controls are unavailable. Always describe the model before submitting.

For Qwen Image 2.1, also read `references/qwen-image-2-1.md` for reference images, transparent backgrounds, and mask editing constraints.

## Guardrails

- Check account credits before expensive or repeated generation.
- Do not automatically resubmit a paid request after a timeout or transport failure; first determine whether a task was created.
- Do not claim completion while a task is queued or running.
- Do not pass `stream: true` to MCP chat; MCP returns one complete tool result.
- Preserve task IDs so interrupted work can resume without resubmission.
