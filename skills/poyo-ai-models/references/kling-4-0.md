# Kling 4.0

Public model: `kling-4.0`. Filtered MCP tool: `poyo_kling_4_0`.

Describe the live model before execution. All four modes use the same model and tool. `video_url` selects editing; otherwise non-empty `reference_image_urls`, `reference_video_urls`, or `kling_elements` select reference-to-video, `image_urls` alone selects image-to-video, and no media selects text-to-video. Use only the fields supported by the selected mode.

Generation requires exactly one of `prompt` (1–26,000 characters) or `multi_prompt`. Each shot in `multi_prompt` contains a non-empty `prompt` of up to 512 characters and an optional integer `duration` of 1–30 seconds (server default 5 per shot). Shot durations must total 3–30 seconds; an explicit top-level `duration` must equal that total. Editing requires `prompt` and does not accept `multi_prompt`.

`duration` is an optional integer from 3 to 30 seconds. Ordinary generation defaults to 5; multi-shot generation uses the shot total. In editing, omit `duration` to follow the source video's original duration. `resolution` supports `720p` and `1080p` (server default `720p`). `aspect_ratio` supports `auto`, `16:9`, `9:16`, `1:1`, and `21:9` in text and reference modes; omit it in image and editing modes. Otherwise omission follows the supplied materials or uses `16:9` without materials. Never inject defaults into requests.

Use `image_urls` for one starting frame and an optional ending frame, in order. In reference mode, only one starting frame is allowed and it counts toward the 10-image limit together with `reference_image_urls`. Supply up to 5 `reference_video_urls`, each lasting 3–30 seconds. All media URLs must be publicly accessible HTTP or HTTPS URLs.

`kling_elements` accepts up to 7 subjects. Each subject provides exactly one of `element_input_urls` (2–4 images, frontal view first) or `element_input_video_urls` (exactly one 3–30 second video). Subjects have no names; reference them as `@Element1`, `@Element2`, and so on. Use `@Image1` and `@Video1` for the corresponding reference arrays. Existing `@image_1` and `@video_1` syntax remains supported. At most 3 subjects may use videos. The original durations of reference videos and video subjects combined cannot exceed 30 seconds. Starting frames, reference images, reference videos, and subjects combined cannot exceed 15 materials; images inside one subject count as one subject.

For editing, supply a 3–30 second source `video_url`. Reference images and image-based subjects are optional. Do not combine editing with `image_urls`, `reference_video_urls`, video subjects, `multi_prompt`, or `aspect_ratio`.

Submit only user-selected fields. Do not send provider options, internal timing, or cost fields. The server validates original video durations. Customer billing sums all input videos, then rounds the sum up once; with video input, billed seconds are the larger of twice the output duration and input-plus-output duration. When editing without an explicit `duration`, the billing output duration is rounded up from the source duration while generation follows the original source. Inspect the live catalog for current pricing and report the final task credits.

```sh
poyo describe kling-4.0
poyo submit kling-4.0 --prompt "A paper boat drifting across a quiet lake" --request-source skill
poyo submit kling-4.0 --prompt "Animate the scene" --image-urls https://example.com/start.png,https://example.com/end.png --request-source skill
poyo submit kling-4.0 --prompt "Use the motion of @Video1 for the scene in @Image1" --reference-image-urls https://example.com/scene.png --reference-video-urls https://example.com/motion.mp4 --duration 10 --request-source skill
poyo submit kling-4.0 --prompt "Replace the background with a snowy forest" --video-url https://example.com/source.mp4 --request-source skill
poyo submit kling-4.0 --input-file request.json --request-source skill
```

Use JSON or `--input-file` for `multi_prompt` and `kling_elements`. For example, `request.json` can contain:

```json
{
  "multi_prompt": [
    {"prompt": "@Element1 walks across the city square", "duration": 4},
    {"prompt": "The camera follows @Element1 toward the river", "duration": 6}
  ],
  "kling_elements": [
    {"element_input_urls": ["https://example.com/front.png", "https://example.com/side.png"]}
  ]
}
```

For filtered MCP, call `poyo_kling_4_0` with the same public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. On unfiltered MCP, call `poyo_submit_job` with `model: "kling-4.0"` and the public fields under `input`; optional `callback_url` remains outside `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`; preserve the task ID and report the final status, credits, and output URLs. Do not resubmit after a transport timeout before checking the original task.
