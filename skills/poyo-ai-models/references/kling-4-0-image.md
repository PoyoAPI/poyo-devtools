# Kling Image 4.0 and Kling Image 4.0 Long Image

Public models: `kling-4.0-image` and `kling-4.0-long-image`. Filtered MCP tools: `poyo_kling_4_0_image` and `poyo_kling_4_0_long_image`.

Describe the selected model before execution. Both models return PNG images in `files`.

## kling-4.0-image

Omit `image_urls` for text-to-image. Pass 1–10 `image_urls` for image-to-image editing and composition with the same model ID. Refer to reference images in the prompt as `@Image1`, `@Image2`, and so on, and to elements as `@Element1`, `@Element2`, and so on.

| Field | Contract |
| --- | --- |
| `prompt` | Required, 1–50000 characters with non-whitespace text |
| `image_urls` | Optional array of 1–10 public HTTP(S) URLs; each up to 30 MB, at least 300 pixels on both sides, aspect ratio between 0.4 and 2.5 |
| `kling_elements` | Up to 7 elements used together with `image_urls`; each is `{"element_input_urls": [...]}` with 2–4 images of one character or object, frontal view first |
| `size` | `auto` (default), `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `3:2`, `2:3`, or `21:9` |
| `resolution` | `2K` (default), `4K`, or `8K` |
| `enable_sequential` | `false` (default) generates `n` independent images; `true` generates a coherent image series returned in order |
| `n` | With `enable_sequential` `false`: 1–9, default 1. With `true`: 2–10, default 4 |

- `image_urls` and `kling_elements` together hold up to 10 items.
- Billing per image: 10 credits at `2K`, 15 at `4K`, and 25 at `8K`, plus 0.5 credits per reference image or element per task. Credits follow the images actually returned.
- Typical time to `finished`: one 2K image about 45 seconds, one 8K image about 2.5 minutes, a 10-image 8K series about 30 minutes. Use `_wait_seconds: 0` or `poyo submit` for large requests and poll the task.

## kling-4.0-long-image

Designs a full webpage or ecommerce product detail page as one tall image.

| Field | Contract |
| --- | --- |
| `prompt` | Required, 1–50000 characters; refer to product images as `@Image1`–`@Image3`, the style reference as `@StyleImage`, and the subject reference as `@SubjectImage` |
| `skill` | `webpage` (default) or `ecommerce` |
| `image_urls` | 1–3 product image URLs, required with `ecommerce` |
| `style_image_url` | Optional style reference for `webpage` |
| `subject_image_url` | Optional subject reference for `webpage` |
| `length` | `ecommerce` page length: `short`, `medium` (default), or `long` |
| `resolution` | `1K` (1024 pixels wide, default) or `2K` (2048 pixels wide) |

- Credits per page: `webpage` 88 at `1K` and 95 at `2K`; `ecommerce` `short` 38 / 45, `medium` 75 / 88, `long` 125 / 138; plus 0.5 credits per reference image.
- A long image usually takes 2–4 minutes, and a `long` ecommerce page at `2K` up to about 12 minutes.

```bash
poyo describe kling-4.0-image
poyo submit kling-4.0-image --prompt "High fashion model wearing a dress made of living moss in an abandoned greenhouse" --size 16:9 --resolution 4K --request-source skill
poyo submit kling-4.0-image --prompt "A four-panel story of a paper boat drifting to a calm lake, same boat in every panel" --size 3:2 --enable-sequential true --n 4 --request-source skill
poyo submit kling-4.0-image --input-file request.json --request-source skill
poyo submit kling-4.0-long-image --prompt "Design a product detail page for the water bottle in @Image1" --skill ecommerce --image-urls https://example.com/water-bottle.png --length medium --request-source skill
```

Use JSON or `--input-file` for `kling_elements`. For example, `request.json` can contain:

```json
{
  "prompt": "Place @Element1 sitting on the sofa in @Image1, reading a book in warm evening light",
  "image_urls": ["https://example.com/living-room.png"],
  "kling_elements": [
    {"element_input_urls": ["https://example.com/character-front.png", "https://example.com/character-side.png"]}
  ],
  "resolution": "2K"
}
```

Submit only user-selected fields. For filtered MCP, call the model-specific tool with `_wait_seconds: 0` and `_request_source: "skill"`. On unfiltered MCP, call `poyo_submit_job` with the model ID and the public fields under `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`, preserve the task ID, and report the final status, credits, and output URLs.
