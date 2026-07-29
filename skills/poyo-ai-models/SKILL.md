---
name: poyo-ai-models
description: Discover, price, and execute PoYo chat and media-generation models through PoYo MCP or CLI. Use when Codex needs to choose a PoYo model, inspect its input schema, run non-streaming chat, stream chat through the CLI, submit image/video/audio/3D generation, poll a task, or report credits and failures.
---

# PoYo AI Models

Use the production Capability Catalog as the source of truth. Never invent model IDs or parameters.

## Choose the integration

1. Prefer hosted MCP at `https://api.poyo.ai/mcp`.
2. Use `?categories=...` or `?models=...` when a small strong-typed tool set is useful; never combine them.
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
6. Reuse one idempotency key for transport retries of the same paid request.
7. Treat queued and running as incomplete. Poll with `poyo_check_job` until succeeded or failed.
8. Report model ID, final status, credits, output URLs, and any partial or failed result.

Read the generated reference matching the requested category when it exists in `references/`.

## Guardrails

- Check account credits before expensive or repeated generation.
- Do not retry a paid failure until the normalized error is inspected.
- Do not claim completion while a task is queued or running.
- Do not pass `stream: true` to MCP chat; MCP returns one complete tool result.
- Preserve task IDs so interrupted work can resume without resubmission.
