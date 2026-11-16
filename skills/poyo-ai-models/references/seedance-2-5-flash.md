# Seedance 2.5 Flash

Public model: `seedance-2.5-flash`. Filtered MCP tool: `poyo_seedance_2_5_flash`.

Describe the live model before execution. Seedance 2.5 Flash is the faster 480p/720p tier of Seedance 2.5 and generates 4–30 second videos with synchronized audio. All three modes use the same model and tool. Non-empty `reference_image_urls`, `reference_video_urls`, or `reference_audio_urls` select reference-to-video; `image_urls` alone selects first/last-frame image-to-video; no media selects text-to-video. Send `image_urls` and the reference fields in separate requests.

`prompt` and `duration` are required. `duration` is an integer from 4 to 30 seconds. `resolution` accepts `480p` or `720p` and defaults to `720p`. `aspect_ratio` accepts `auto`, `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, and `9:16` and defaults to `auto`; with `image_urls`, use `auto` or omit it so the output follows the first frame. `generate_audio` defaults to `true`; set it to `false` only when the user wants a silent video. Never inject defaults into requests.

`image_urls` takes a first frame, or a first frame followed by a last frame (1–2 JPEG, PNG, or WebP URLs, each up to 30 MB). Use a last frame with the same aspect ratio as the first frame.

In reference mode, supply up to 10 `reference_image_urls` (JPEG, PNG, or WebP, up to 30 MB each), up to 5 `reference_video_urls` (MP4 or MOV, 2–30 seconds and up to 200 MB each), and up to 5 `reference_audio_urls` (MP3 or WAV, 2–30 seconds and up to 15 MB each). Reference audio is used together with reference images or videos. Reference videos together can last up to 30 seconds, and reference audio clips together can last up to 30 seconds; the server checks both totals at submission. Refer to media by upload order as `@Image1`, `@Video1`, and `@Audio1`, and state each item's role in the prompt. All media URLs must be publicly accessible HTTP or HTTPS URLs.

Submit only user-selected fields. Do not send provider options, internal timing, or cost fields. Billing is per second at a rate set by `resolution` and by whether `reference_video_urls` is present. Without reference videos, billed seconds equal the output duration; with reference videos, billed seconds are the output duration plus each reference video's duration floored to whole seconds. Inspect the live catalog for current pricing and report the final task credits.

```sh
poyo describe seedance-2.5-flash
poyo submit seedance-2.5-flash --prompt "A paper boat drifts down a rain-filled street gutter at dusk, neon reflections rippling on the water" --duration 5 --resolution 480p --request-source skill
poyo submit seedance-2.5-flash --prompt "Time-lapse from the summer evening in the first frame to the snowy night in the last frame" --image-urls https://example.com/first.jpg,https://example.com/last.jpg --duration 5 --request-source skill
poyo submit seedance-2.5-flash --prompt "@Image1 is the ginger cat; match the slow rhythm of @Audio1" --reference-image-urls https://example.com/cat.png --reference-audio-urls https://example.com/rhythm.mp3 --duration 6 --request-source skill
poyo submit seedance-2.5-flash --input-file request.json --request-source skill
```

For filtered MCP, call `poyo_seedance_2_5_flash` with the same public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. On unfiltered MCP, call `poyo_submit_job` with `model: "seedance-2.5-flash"` and the public fields under `input`; optional `callback_url` remains outside `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`; preserve the task ID and report the final status, credits, and output URLs. Do not resubmit after a transport timeout before checking the original task.
