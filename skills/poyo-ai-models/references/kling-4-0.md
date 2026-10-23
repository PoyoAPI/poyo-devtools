# Kling 4.0

Public model: `kling-4.0`. Filtered MCP tool: `poyo_kling_4_0`.

Describe the live model before execution. Generate from a required non-empty `prompt` of up to 8,000 characters, optionally adding reference images or reference videos. `duration` is an integer from 3 to 30 seconds (server default 5). `resolution` supports `720p` and `1080p` (server default `720p`). `aspect_ratio` supports `auto`, `16:9`, `9:16`, `1:1`, and `21:9`; when omitted, the server adapts to references or uses `16:9` for text-only generation.

Use `reference_image_urls` for up to 10 images and mention them as `@image_1`, `@image_2`, and so on. Use `reference_video_urls` for up to 5 videos and mention them as `@video_1`, `@video_2`, and so on. Each reference video must last 3–30 seconds, with a combined duration of at most 30 seconds. All media URLs must be publicly accessible HTTP or HTTPS URLs.

Submit only fields the user supplied. Do not inject defaults or send `image_urls`, `video_urls`, `elements`, `multi_prompt`, `sound`, voice controls, or internal timing and billing fields. Duration validation uses the original measured durations. For billing, the server first sums all `reference_video_urls` durations, then rounds that sum up to whole seconds. Without reference videos, billing uses output duration. With reference videos, billed seconds are the larger of twice the output duration and the sum of the rounded input duration and output duration; inspect the live catalog for resolution-dependent rates.

```sh
poyo describe kling-4.0
poyo submit kling-4.0 --prompt "A paper boat drifting across a quiet lake" --request-source skill
poyo submit kling-4.0 --prompt "Use the motion of @video_1 for the scene in @image_1" --reference-image-urls https://example.com/scene.png --reference-video-urls https://example.com/motion.mp4 --duration 10 --request-source skill
```

For filtered MCP, call `poyo_kling_4_0` with the same public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. On unfiltered MCP, call `poyo_submit_job` with `model: "kling-4.0"` and the public fields under `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`; report the final status, credits, and output URLs.
