# MiniMax H3 Image

Public model: `minimax-h3-image`. Filtered MCP tool: `poyo_minimax_h3_image`.

Describe the live model before execution. Each request returns one image. Omit `image_urls` for text-to-image; supply 1–16 `image_urls` to edit or combine reference images. Generation and editing share the same model and tool.

| Field | Contract |
| --- | --- |
| `prompt` | Required, 1–5000 characters with non-whitespace text |
| `image_urls` | Optional array of 1–16 public HTTP(S) URLs; JPEG, PNG, or WEBP, up to 20 MB, each side 128–8192 pixels |
| `size` | `1:1`, `5:4`, `4:5`, `4:3`, `3:4`, `3:2`, `2:3`, `16:9`, `9:16`, `21:9`, `auto`, or custom `WIDTHxHEIGHT` |
| `resolution` | `1K`, `2K`, or `4K`; default `2K` |
| `output_format` | `png` or `jpeg`; default `png` |
| `enable_prompt_expansion` | Boolean, default `true`; applies to text-to-image, and editing always expands the prompt |

- Aspect-ratio sizes take their pixel dimensions from `resolution`. Text-to-image defaults to `1:1`; editing defaults to `auto`, which follows the aspect ratio of `<Picture 1>` at about the pixel area of the selected tier.
- Custom `WIDTHxHEIGHT` uses integers with 655,360–20,000,000 total pixels and an aspect ratio between 1:3 and 3:1. The output has exactly the requested width and height.
- Reference images are numbered by array order. Refer to them in the prompt as `<Picture 1>`, `<Picture 2>`, and so on. Put exact on-image text in quotes and state where it goes.
- Pricing per image: 3.2 credits at `1K` or `2K`, 11.2 at `4K`, plus 0.5 credits per reference image. A custom size up to 4,500,000 pixels bills as `2K`; a larger custom size bills as `4K`. Confirm the live catalog before an expensive run.

Submit only user-selected fields. Use `--output-format` for the image format; CLI `--format` controls terminal output.

```bash
poyo describe minimax-h3-image
poyo run minimax-h3-image --prompt "A vintage travel poster for Kyoto with the headline 'KYOTO'" --size 16:9 --resolution 2K --request-source skill
poyo run minimax-h3-image --prompt "Place the sofa from <Picture 2> in the empty room in <Picture 1>. Keep the walls and daylight of <Picture 1>." --image-urls https://example.com/empty-room.png,https://example.com/sofa.png --request-source skill
poyo run minimax-h3-image --prompt "Minimal presentation background, navy to teal gradient" --size 1920x1080 --output-format jpeg --enable-prompt-expansion false --request-source skill
```

For filtered MCP, call `poyo_minimax_h3_image` with the same public fields and `_request_source: "skill"`. On unfiltered MCP, call `poyo_run_model` or `poyo_submit_job` with `model: "minimax-h3-image"`. Poll an unfinished task with `poyo_check_job` without resubmitting it, and report the final credits and output URL.
