# Vidu Q4

Public model: `vidu-q4`. Filtered MCP tool: `poyo_vidu_q4`.

Describe the live model before execution. Use one `image_urls` item for a starting frame, or at least one `reference_image_urls` item for reference-to-video. Reference audio requires reference images. Starting-frame input cannot be combined with references. Empty arrays are invalid; omit unused fields.

`prompt` is required and non-empty for reference mode, optional for a starting frame, and limited to 5,000 characters. `duration` is an integer from 3 to 16 seconds (server default 5). `resolution` supports `540p`, `720p`, `1080p`, `2k`, and `4k` (server default `720p`). Reference mode accepts `aspect_ratio` (`16:9`, `9:16`, `4:3`, `3:4`, `1:1`) and boolean `generate_audio`; omit both in starting-frame mode. `enable_safety_checker` is an optional boolean.

Reference mode accepts up to 12 images and 3 audio clips. Each audio clip must be an MP3 lasting 3–12 seconds. Images and reference audio accept publicly accessible HTTP or HTTPS URLs.

Submit only fields the user supplied. Do not inject defaults or send `seed`, `image_url`, `audio_url`, upstream options, or internal cost fields. Inspect live pricing before submission; charges depend on requested duration and resolution.

```sh
poyo describe vidu-q4
poyo submit vidu-q4 --image-urls https://example.com/start.png --duration 6 --request-source skill
poyo submit vidu-q4 --prompt "The character walks through the scene" --reference-image-urls https://example.com/character.png --reference-audio-urls https://example.com/mood.mp3 --request-source skill
```

For filtered MCP, call `poyo_vidu_q4` with the same public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. For unfiltered MCP, call `poyo_submit_job` with `model: "vidu-q4"` and the public fields under `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`; report the final status, credits, and output URLs.
