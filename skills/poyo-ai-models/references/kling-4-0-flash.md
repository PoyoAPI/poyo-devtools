# Kling 4.0 Flash

Public model: `kling-4.0-flash`. Filtered MCP tool: `poyo_kling_4_0_flash`.

Describe the live model before execution. Kling 4.0 Flash is the faster 720p tier of Kling 4.0, and all four modes use the same model and tool. `video_url` selects editing; otherwise non-empty `reference_image_urls`, `reference_video_urls`, or `kling_elements` select reference-to-video, `image_urls` alone selects image-to-video, and no media selects text-to-video. Use only the fields supported by the selected mode; the server rejects the rest.

`prompt` (1–26,000 characters) is required in text, reference, and editing modes and optional in image-to-video. Flash does not accept `multi_prompt`; use Kling 4.0 for multi-shot prompts.

`duration` is an optional integer from 3 to 20 seconds; generation defaults to 5. In editing, omit `duration` to follow the source video's duration. `resolution` supports only `720p`. `aspect_ratio` supports `auto`, `16:9`, `9:16`, `1:1`, and `21:9` in text and reference modes and defaults to `16:9`; in text-to-video, `auto` is treated as `16:9`. Omit it in image and editing modes. Never inject defaults into requests.

`image_urls` accepts exactly one starting frame; Flash has no ending frame. In reference mode, the starting frame counts toward the 10-image limit together with `reference_image_urls`. Supply up to 5 `reference_video_urls` in reference mode, each lasting 3–20 seconds. All media URLs must be publicly accessible HTTP or HTTPS URLs.

`kling_elements` accepts up to 7 subjects. Each subject provides exactly one of `element_input_urls` (2–4 images, frontal view first) or `element_input_video_urls` (exactly one 3–8 second video). At most 3 subjects may use videos. Subjects have no names; reference them as `@Element1`, `@Element2`, and so on. Use `@Image1` for reference images. Existing `@image_1` and `@video_1` syntax remains supported. In reference mode, starting frames, reference images, reference videos, and subjects combined cannot exceed 15 materials; images inside one subject count as one subject.

For editing, supply a 3–20 second source `video_url` and a `prompt`. Editing also accepts reference images, up to 4 `reference_video_urls`, and image or video subjects. The source video is `@Video1`; reference videos start at `@Video2`. Do not combine editing with `image_urls` or `aspect_ratio`.

All input videos together — source, reference, and subject videos — cannot exceed 20 seconds. The server probes original durations.

Submit only user-selected fields. Do not send provider options, internal timing, or cost fields. Without video input, billing follows the output duration. With video input, billed seconds are the output duration plus the larger of the output duration and the combined input video duration, rounded up once after summing. When editing without an explicit `duration`, the billing output duration is rounded up from the source duration. Inspect the live catalog for current pricing and report the final task credits.

```sh
poyo describe kling-4.0-flash
poyo submit kling-4.0-flash --prompt "A paper boat drifting across a quiet lake" --request-source skill
poyo submit kling-4.0-flash --image-urls https://example.com/start.png --duration 10 --request-source skill
poyo submit kling-4.0-flash --prompt "Use the motion of @Video1 for the scene in @Image1" --reference-image-urls https://example.com/scene.png --reference-video-urls https://example.com/motion.mp4 --duration 8 --request-source skill
poyo submit kling-4.0-flash --prompt "Replace the background of @Video1 with a snowy forest" --video-url https://example.com/source.mp4 --request-source skill
poyo submit kling-4.0-flash --input-file request.json --request-source skill
```

Use JSON or `--input-file` for `kling_elements`. For example, `request.json` can contain:

```json
{
  "prompt": "@Element1 walks through the city square shown in @Image1",
  "reference_image_urls": ["https://example.com/square.png"],
  "kling_elements": [
    {"element_input_urls": ["https://example.com/front.png", "https://example.com/side.png"]}
  ]
}
```

For filtered MCP, call `poyo_kling_4_0_flash` with the same public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. On unfiltered MCP, call `poyo_submit_job` with `model: "kling-4.0-flash"` and the public fields under `input`; optional `callback_url` remains outside `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`; preserve the task ID and report the final status, credits, and output URLs. Do not resubmit after a transport timeout before checking the original task.
