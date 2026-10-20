# Flux 3 Max

Describe the live model before execution and select the model that matches the supplied media:

| Model | Required media | Filtered MCP tool |
| --- | --- | --- |
| `flux-3-max/text-to-video` | None | `poyo_flux_3_max_text_to_video` |
| `flux-3-max/image-to-video` | 1-2 ordered `image_urls` | `poyo_flux_3_max_image_to_video` |
| `flux-3-max/keyframes-to-video` | 1-10 `keyframes` | `poyo_flux_3_max_keyframes_to_video` |

All three require a non-empty `prompt`. Shared optional inputs are integer `duration` (5-20, default 5), `resolution` (`720p` default or `1080p`), `aspect_ratio`, and boolean `sound` (default true). Supply only user-selected fields.

Aspect ratios are `auto`, `21:9`, `2:1`, `16:9`, `4:3`, `1:1`, `3:4`, or `9:16`. `auto` uses 16:9 for text and follows the first image in image or keyframe mode.

Text mode accepts no media fields. In image mode, item 0 of `image_urls` is the starting frame and optional item 1 is the ending frame. In keyframe mode, each item has an HTTP(S) `image_url` and integer `frame_index`; positions must be unique and between 0 and `duration * 24`, inclusive. Images must be publicly accessible PNG, JPEG, or WebP URLs.

Send nested keyframes through JSON input or `--input-file`. For example:

```json
{
  "prompt": "Move smoothly through both scenes",
  "duration": 5,
  "keyframes": [
    {"image_url": "https://example.com/start.png", "frame_index": 0},
    {"image_url": "https://example.com/end.png", "frame_index": 120}
  ]
}
```

Use `_wait_seconds: 0` on filtered MCP and poll `poyo_check_job`. For CLI, use `poyo submit MODEL --input-file request.json --format json --request-source skill`, then wait for the returned task ID. Keep `callback_url` outside model input. Inspect live pricing; requested duration and resolution determine the charge, and the audio setting does not change it.
