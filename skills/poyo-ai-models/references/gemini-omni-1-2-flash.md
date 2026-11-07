# Gemini Omni 1.2 Flash

Public model: `gemini-omni-1.2-flash`. Filtered MCP tool: `poyo_gemini_omni_1_2_flash`.

Describe the live model before execution. All four modes use the same model and tool. `video_url` selects video editing; otherwise non-empty `reference_image_urls` or `reference_video_urls` select reference generation, `image_urls` alone selects first/last-frame generation, and no media selects text-to-video. Use only the fields supported by the selected mode.

`prompt` is required in every mode (1–20,000 characters). In editing it is the edit instruction.

`duration` is an optional integer from 3 to 15 seconds (server default 8). When `image_urls` contains both a first and a last frame, `duration` must be at most 10. `resolution` supports `360p`, `720p`, `1080p`, and `4k` (server default `720p`). `aspect_ratio` supports `16:9` and `9:16` (server default `16:9`). Never inject defaults into requests.

Use `image_urls` for one starting frame and an optional ending frame, in order. Do not combine `image_urls` with `reference_image_urls` or `reference_video_urls`. Reference generation accepts up to 10 `reference_image_urls` and up to 3 `reference_video_urls`, each video at most 15 seconds long; images and videos can be sent together. All media URLs must be publicly accessible HTTP or HTTPS URLs; Base64 and data URLs are unsupported.

For editing, supply a source `video_url` of at most 15 seconds. Only `prompt` and `resolution` may accompany it; do not send `duration`, `aspect_ratio`, `image_urls`, `reference_image_urls`, or `reference_video_urls`. The output length follows the source video.

Submit only user-selected fields. Do not send seed, audio switches, internal timing, or cost fields. The server probes video durations. Billing is per output second by resolution: generation bills `duration`, and editing bills the source video duration rounded up to whole seconds. Inspect the live catalog for current pricing and report the final task credits.

```sh
poyo describe gemini-omni-1.2-flash
poyo submit gemini-omni-1.2-flash --prompt "A cinematic night city with neon reflections" --duration 8 --request-source skill
poyo submit gemini-omni-1.2-flash --prompt "Transition smoothly between the two frames" --image-urls https://example.com/start.png,https://example.com/end.png --duration 8 --request-source skill
poyo submit gemini-omni-1.2-flash --prompt "Use the product image with the motion of the reference video" --reference-image-urls https://example.com/product.png --reference-video-urls https://example.com/motion.mp4 --duration 10 --request-source skill
poyo submit gemini-omni-1.2-flash --prompt "Turn the scene into a watercolor painting" --video-url https://example.com/source.mp4 --request-source skill
```

For filtered MCP, call `poyo_gemini_omni_1_2_flash` with the same public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. On unfiltered MCP, call `poyo_submit_job` with `model: "gemini-omni-1.2-flash"` and the public fields under `input`; optional `callback_url` remains outside `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`; preserve the task ID and report the final status, credits, and output URLs. Do not resubmit after a transport timeout before checking the original task.
