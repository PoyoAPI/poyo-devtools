# GPT Image 2.6

Use `gpt-image-2.6-fixed` for the faster option or `gpt-image-2.6-sunburst` when detail and edit precision matter. Inspect the selected model with describe before execution. Both models return one image per request and use the same public inputs as GPT Image 2.5.

- Use public inputs `prompt`, `image_urls`, `size`, `resolution`, `quality`, `background`, `output_format`, and `mask_url`.
- Omit `image_urls` for generation, or provide up to 16 HTTP(S) reference images for editing. A mask requires reference images.
- Defaults are square `1:1`, resolution `1K`, quality `high`, background `auto`, and format `png`. Quality also supports `low`, `medium`, `xhigh`, and `max`.
- Do not add image-count controls. Use `output_format` for image format; CLI `--format` controls terminal output.
- Transparent backgrounds require `png` or `webp`. `jpeg` supports opaque or automatic backgrounds.
- Use `size=auto` only at `1K`. At `2K` or `4K`, select an aspect ratio or custom size; omitted size selects a square.
- Custom `WIDTHxHEIGHT` requires `2K` or `4K`, dimensions divisible by 16, max edge 3840, ratio at most 3:1, and 655360–8294400 pixels. A 3840-pixel edge requires `4K`. For aspect ratios, actual pixels may vary; inspect the returned image. Use a custom size for exact pixels.
- The submit quote is a high token estimate and is the maximum charge. A later supplier bill can lower it, and never increases it. Reference images are included in that estimate per URL, including repeats. A mask has no additional charge.

```bash
poyo describe gpt-image-2.6-fixed
poyo run gpt-image-2.6-sunburst --prompt "A silver robot on a desk" --size 16:9 --resolution 2K --request-source skill
poyo run gpt-image-2.6-fixed --prompt "A clean cutout of a small silver robot" --background transparent --output-format webp --resolution 2K --request-source skill
poyo run gpt-image-2.6-sunburst --prompt "Replace only the masked area with flowers" --image-urls https://example.com/room.png --mask-url https://example.com/mask.png --size auto --request-source skill
```

For typed MCP tools, use `poyo_gpt_image_2_6_fixed` or `poyo_gpt_image_2_6_sunburst` and `_request_source: "skill"` after the models appear on a filtered connection. Poll an unfinished task with `poyo_check_job` without resubmitting it.
