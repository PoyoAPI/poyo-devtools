# Seedream 5.5 and Seedream 5.5 Layerize

Describe the selected model in the live catalog before execution.

## Seedream 5.5

Public model: `seedream-5.5`. Filtered MCP tool: `poyo_seedream_5_5`.

Each request returns one image. Omit `image_urls` for text-to-image; supply 1–10 `image_urls` to edit or combine reference images. Generation and editing share the same model and tool.

| Field | Contract |
| --- | --- |
| `prompt` | Required, 5–5000 characters |
| `image_urls` | Optional array of 1–10 public HTTP(S) URLs; JPEG, PNG, or WEBP up to 10 MB |
| `size` | `1:1`, `4:3`, `3:4`, `16:9`, `9:16`, `3:2`, `2:3`, `21:9`, or `auto` |
| `resolution` | `1K`, `1.5K`, or `2K`; default `2K` |
| `background` | `auto`, `transparent`, or `opaque`; default `auto` |
| `output_format` | `png` or `jpeg`; default `png` |
| `enable_safety_checker` | Boolean, default `true` |

- `size` is the aspect ratio and `resolution` is the pixel tier; keep them in their own fields. Text-to-image defaults to `1:1`; editing defaults to `auto`, which follows the reference images at about the selected tier's pixel area.
- `background: transparent` returns an RGBA PNG and requires `output_format: png`. `opaque` returns an RGB image.
- For edits, say what changes and what stays the same, and refer to references by order (image 1, image 2, and so on).
- Pricing per image: 4 credits at `1K` or `1.5K`, 7 at `2K`, plus 1.6 credits per reference image. Confirm the live catalog before an expensive run.

```bash
poyo describe seedream-5.5
poyo run seedream-5.5 --prompt "A ceramic pour-over coffee set on a walnut counter, soft morning light" --size 16:9 --resolution 2K --request-source skill
poyo run seedream-5.5 --prompt "Put the handbag from image 2 on the table in image 1. Keep the lighting of image 1." --image-urls https://example.com/living-room.png,https://example.com/handbag.png --request-source skill
poyo run seedream-5.5 --prompt "A red paper lantern sticker on a transparent background" --background transparent --output-format png --resolution 1K --request-source skill
```

## Seedream 5.5 Layerize

Public model: `seedream-5.5-layerize`. Filtered MCP tool: `poyo_seedream_5_5_layerize`.

Layerize splits one image into a base image and transparent PNG layers. The task returns one file per image, base image first, and each file carries a `layer` object with its position, name, and description.

| Field | Contract |
| --- | --- |
| `image_urls` | Required array with exactly 1 public HTTP(S) URL; JPEG or PNG up to 10 MB, 512x512 to 6000x6000 pixels, aspect ratio 1:16 to 16:1 |
| `prompt` | Optional, up to 2000 characters, describing how to split the image; without it the model puts each main element on its own layer |
| `max_images` | Integer 2–100 including the base image; default 30 |
| `resolution` | `1K`, `1.5K`, `2K`, or `auto`; default `auto` |
| `output_format` | `png` or `jpeg` for the base image; default `png`; layers are always transparent PNG |
| `text_recognition` | Boolean, default `false`; `true` adds OCR text, line positions, and approximate styles in `layer.text_recognition` |
| `enable_safety_checker` | Boolean, default `true` |

- `auto` keeps the original size between 1K and 2K, upscales smaller images to 1K, and downscales larger images to 2K. The base image keeps the input aspect ratio; each layer keeps its own aspect ratio at about the selected tier.
- The number of returned images follows the image content, up to `max_images`. Larger values give finer decomposition.
- Pricing: per returned image 4 credits at `1K` or `1.5K` and 7 at `2K` or `auto`, plus 1.6 credits for the input image. Submission reserves credits for `max_images`; success settles by the images actually returned. Report the final task credits.

```bash
poyo describe seedream-5.5-layerize
poyo submit seedream-5.5-layerize --image-urls https://example.com/poster.png --request-source skill
poyo submit seedream-5.5-layerize --prompt "Put each animal on its own layer and keep the rest in the base image" --image-urls https://example.com/animals.png --max-images 40 --resolution 2K --request-source skill
poyo submit seedream-5.5-layerize --image-urls https://example.com/event-poster.png --max-images 15 --resolution 1K --text-recognition true --request-source skill
```

Submit only user-selected fields for both models. Use `--output-format` for the image format; CLI `--format` controls terminal output. For filtered MCP, call the model-specific tool with `_request_source: "skill"`; use `_wait_seconds: 0` for Layerize. On unfiltered MCP, use `poyo_run_model` for Seedream 5.5 or `poyo_submit_job` for Layerize. Poll an unfinished task with `poyo_check_job` without resubmitting it, and report every output URL with its layer metadata.
