# PixVerse V6 Max

Public model: `pixverse-v6-max`. Filtered MCP tool: `poyo_pixverse_v6_max`.

Describe the live model before execution. Omit `image_urls` for text-to-video. Pass exactly one public HTTP or HTTPS image URL for image-to-video. Do not send a first and last frame, multiple images, or a source video.

`prompt` is required for text-to-video, up to 5,000 characters. It is optional for image-to-video, up to 2,048 characters, and cannot be blank when provided. `duration` is an integer from 1 to 15 seconds. `resolution` is `360p`, `540p`, `720p`, or `1080p`. `aspect_ratio` is text-to-video only: `16:9`, `9:16`, `4:3`, `3:4`, `1:1`, `2:3`, `3:2`, or `21:9`. `audio` is an optional boolean. Do not send `seed`.

Submit only fields the user supplied. Do not inject duration, resolution, aspect ratio, or audio defaults. Image-to-video must not include `aspect_ratio`.

```sh
poyo describe pixverse-v6-max
poyo submit pixverse-v6-max --prompt "A blue glass marble rolls across a clean white table" --duration 5 --resolution 540p --aspect-ratio 16:9 --request-source skill
poyo submit pixverse-v6-max --prompt "Animate this product with gentle movement" --image-urls https://example.com/product.jpg --request-source skill
```

For filtered MCP, call `poyo_pixverse_v6_max` with the same public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. For unfiltered MCP, call `poyo_submit_job` with `model: "pixverse-v6-max"` and the public fields under `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`; report the final status, credits, and output URLs.
