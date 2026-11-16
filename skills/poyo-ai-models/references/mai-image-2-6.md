# MAI Image 2.6 and MAI Image 2.6 Flash

Public models: `mai-image-2.6` and the faster, lower-cost `mai-image-2.6-flash`. Filtered MCP tools: `poyo_mai_image_2_6` and `poyo_mai_image_2_6_flash`.

Describe the selected model before execution. Both models share the same inputs and return one PNG image per request. Omit `image_urls` for text-to-image; one reference image is edited, and 2–5 are combined.

| Field | Contract |
| --- | --- |
| `prompt` | Required, 1–32000 characters with non-whitespace text; put exact on-image text in quotes |
| `image_urls` | Optional array of 1–5 public HTTP(S) URLs; JPEG, PNG, WebP, or GIF |
| `size` | Text-to-image only: `1:1`, `4:3`, `3:4`, `3:2`, `2:3`, `16:9`, `9:16`, or custom `WIDTHxHEIGHT`; default `1:1` |
| `resolution` | Text-to-image aspect-ratio sizes only: `1K` (about 1 megapixel) or `2K` (about 2.3 megapixels); default `1K` |
| `enable_web_search` | Boolean, default `false`; looks up real-time web information for current events and real places, products, or people at no extra charge |

- Custom `WIDTHxHEIGHT` needs both sides divisible by 32, each side at least 768, and at most 2,359,296 total pixels (for example `1536x1536` or `3072x768`). It sets the exact output size on its own, so pair `resolution` only with aspect-ratio sizes.
- Edit and composition output is about 1 megapixel and follows the reference images, so send only `prompt`, `image_urls`, and optional `enable_web_search` when editing. Reference images larger than 1 megapixel are downscaled first.
- Billing is by tokens. Output tokens are width × height / 1024; each reference image adds up to 1024 image input tokens. Submission reserves a maximum based on size, prompt length, and references; success charges the lower of that amount and the actual usage. Failed tasks are not charged.
- Token prices per million: MAI Image 2.6 charges 800 text input, 1280 image input, and 6080 output credits; Flash charges 280, 400, and 3040. Typical output cost for `1:1` is about 6.23 credits at `1K` and 14.01 at `2K` for MAI Image 2.6, and about 3.11 and 7 for Flash. Confirm the live catalog before an expensive run and report the final task credits.

```bash
poyo describe mai-image-2.6
poyo run mai-image-2.6 --prompt "A campus poster at dusk with the title \"Open Day 2026\"" --size 16:9 --resolution 2K --request-source skill
poyo run mai-image-2.6-flash --prompt "Change the bicycle to blue and add a small dog next to it" --image-urls https://example.com/bicycle.png --request-source skill
poyo run mai-image-2.6 --prompt "A travel poster of the Eiffel Tower at night with the text \"Paris\"" --size 2:3 --enable-web-search true --request-source skill
poyo run mai-image-2.6-flash --prompt "A wide panoramic banner of a mountain range at sunrise" --size 3072x768 --request-source skill
```

Submit only user-selected fields. For filtered MCP, call the model-specific tool with `_request_source: "skill"`. On unfiltered MCP, call `poyo_run_model` or `poyo_submit_job` with the model ID. Poll an unfinished task with `poyo_check_job` without resubmitting it.
