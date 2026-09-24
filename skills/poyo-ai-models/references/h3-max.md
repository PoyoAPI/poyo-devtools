# H3 Max

Public model: `h3-max`. Model-specific MCP tool: `poyo_h3_max`.

The rollout configuration enables this model. Always describe the model in the live catalog before use; deployment availability can differ from this snapshot.

Use the existing dynamic CLI (`poyo run h3-max`) or hosted MCP. No model-specific command is required. Prefer `poyo_submit_job` for long video jobs and poll the returned task ID. Do not retry a paid submission automatically.

| Field | Contract |
| --- | --- |
| `prompt` | Required, 1–50,000 characters |
| `duration` | Integer 5–15 seconds, default 5 |
| `resolution` | `480p`, `768p`, `1080p`; default `768p` |
| `enable_safety_checker` | Optional boolean, default `true` in every mode; `false` disables the safety checker |
| `image_urls` | Up to 2: first frame, then optional last frame |
| `reference_image_urls` | Up to 9 |
| `reference_video_urls` | Up to 3; requires reference images |
| `reference_audio_urls` | Up to 3; requires reference images |
| `aspect_ratio` | Text defaults to `16:9`, references default to `adaptive`; forbidden with first/last frames |

All media links must be HTTP(S) URLs. Reference assets total at most 12. Video and audio clips must each be 2–15 seconds; combined video duration and combined audio duration each have a 15-second limit. Fixed output ratios are `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, and `9:16`; only reference mode accepts `adaptive`.

Nonempty `image_urls` selects image mode and cannot be combined with references. Nonempty `reference_image_urls` selects reference mode. No media selects text mode. Empty arrays count as absent. Supply only user-selected fields; do not inject defaults into the submitted input.

References share one allowance. Additional material can increase the total charge. The server calculates tokens; never send `reference_tokens`, `_channel_cost_usd`, media metadata, or `prompt_expansion_mode`. If media counting fails, report the error without replacing it with an estimated charge.

Reference images support `1:1`, `4:3`, `3:4`, `16:9`, `9:16`, `5:2`, and `2:5` shapes. Reference videos require constant 24 fps, square pixels, no rotation metadata, and `16:9` or `9:16`; after capping at the requested output duration, counted frames must be 48, 120, 240, or 360. Reference audio requires 32 kHz, a decoded sample count divisible by 800, and a duration no longer than the requested output. Do not silently convert or resubmit rejected media.

```sh
poyo describe h3-max
poyo run h3-max --prompt "A coastal city at sunrise" --request-source skill
poyo run h3-max --prompt "The camera glides forward" --image-urls 'https://example.com/start.jpg,https://example.com/end.jpg' --duration 8 --resolution 1080p --request-source skill
poyo run h3-max --prompt "Image 1 follows Video 1 with Audio 1" --reference-image-urls https://example.com/subject.jpg --reference-video-urls https://example.com/motion.mp4 --reference-audio-urls https://example.com/atmosphere.wav --duration 10 --request-source skill
```

For `poyo_h3_max`, use the same input fields as tool arguments and add `_request_source: "skill"`. For `poyo_submit_job`, put them under `input` and set `model: "h3-max"`. Preserve the task ID and report final status, credits, and output URLs.
