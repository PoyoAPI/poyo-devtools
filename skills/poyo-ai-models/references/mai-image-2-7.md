# MAI Image 2.7 and MAI Image 2.7 Flash

Public models: `mai-image-2.7` and the faster, lower-cost `mai-image-2.7-flash`. Filtered MCP tools: `poyo_mai_image_2_7` and `poyo_mai_image_2_7_flash`.

Describe the selected model before execution. Both models share the same inputs and return one image per request. Omit `image_urls` for text-to-image; one reference image is edited, and 2–5 are combined into one image.

| Field | Contract |
| --- | --- |
| `prompt` | Required, 1–32000 characters with non-whitespace text; put exact on-image text in quotes |
| `image_urls` | Optional array of 1–5 public HTTP(S) URLs; JPEG, PNG, or WebP |
| `size` | `1:1`, `4:3`, `3:4`, `3:2`, `2:3`, `16:9`, `9:16`, or custom `WIDTHxHEIGHT`; text-to-image default `1:1` |
| `resolution` | `1K` (about 1 megapixel) or `2K` (about 4 megapixels) for aspect-ratio sizes; default `1K` |
| `background` | `opaque` (default) or `transparent`; use `transparent` with `output_format` `png` or `webp` |
| `output_format` | `png` (default), `jpeg`, or `webp` |

- Custom `WIDTHxHEIGHT` needs both sides divisible by 16, each side at least 768, and at most 4,194,304 total pixels (for example `2048x2048` or `3072x1344`). A custom size sets the exact output size, so pair `resolution` only with aspect-ratio sizes.
- In editing and composition, the output follows the aspect ratio of the first reference image at about 1 megapixel; pass `size` to choose another size. Reference images are used at up to about 1 megapixel.
- Billing is by tokens. Output tokens are width × height / 1024; each reference image adds up to 1024 image input tokens; text tokens are the UTF-8 bytes of the prompt / 4. Submission reserves a maximum based on size, prompt length, and references; success charges the lower of that amount and the actual usage. Credits are charged only for successful tasks.
- Token prices per million: MAI Image 2.7 charges 800 text input, 1280 image input, and 5440 output credits; Flash charges 280, 400, and 1600. A `1:1` image at `1K` costs about 5.58 credits on MAI Image 2.7 and about 1.64 on Flash; a `16:9` image at `2K` costs about 22.2 and 6.53. Confirm the live catalog before an expensive run and report the final task credits.

```bash
poyo describe mai-image-2.7
poyo run mai-image-2.7 --prompt "A university campus poster at dusk with the title \"Open Day 2026\"" --size 16:9 --resolution 2K --request-source skill
poyo run mai-image-2.7-flash --prompt "Change the bicycle to blue and add a small dog next to it" --image-urls https://example.com/bicycle.png --request-source skill
poyo run mai-image-2.7 --prompt "A flat vector logo of a red fox head, clean edges" --background transparent --output-format webp --request-source skill
poyo run mai-image-2.7-flash --prompt "A wide panoramic banner of a mountain range at sunrise" --size 3072x1344 --request-source skill
```

Submit only user-selected fields. For filtered MCP, call the model-specific tool with `_request_source: "skill"`. On unfiltered MCP, call `poyo_run_model` or `poyo_submit_job` with the model ID. Poll an unfinished task with `poyo_check_job` without resubmitting it.
