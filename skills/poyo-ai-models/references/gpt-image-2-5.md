# GPT Image 2.5

Use `gpt-image-2.5-flare` or `gpt-image-2.5-sunburst`. Inspect the selected model with describe before execution; both models return one image per request.

- Use public inputs `prompt`, `image_urls`, `size`, `resolution`, `quality`, `background`, `output_format`, and `mask_url`.
- Omit `image_urls` for generation, or provide up to 16 HTTP(S) reference images for editing. A mask requires reference images.
- Defaults are square `1:1`, resolution `1K`, quality `low`, background `auto`, and format `png`. Quality also supports `medium`, `high`, `xhigh`, and `max`.
- Do not add image-count controls. Use `output_format` for image format; CLI `--format` controls terminal output.
- Transparent backgrounds require `png` or `webp`. `jpeg` supports opaque or automatic backgrounds.
- Use `size=auto` only at `1K`. At `2K` or `4K`, select an aspect ratio or custom size; omitted size selects a square.
- Custom `WIDTHxHEIGHT` requires `2K` or `4K`, dimensions divisible by 16, max edge 3840, ratio at most 3:1, and 655360–8294400 pixels. A 3840-pixel edge requires `4K`; a 4K square uses 2880×2880.
- Inspect the catalog for current quality/resolution pricing. Input images and masks have no additional charge for these models.

```bash
poyo describe gpt-image-2.5-flare
poyo run gpt-image-2.5-flare --prompt "A clean cutout of a small silver robot" --background transparent --output-format webp --resolution 2K --request-source skill
poyo run gpt-image-2.5-sunburst --prompt "Replace only the masked area with flowers" --image-urls https://example.com/room.png --mask-url https://example.com/mask.png --size auto --request-source skill
```

For typed MCP tools, use `poyo_gpt_image_2_5_flare` or `poyo_gpt_image_2_5_sunburst` and `_request_source: "skill"`. Poll an unfinished task with `poyo_check_job` without resubmitting it.
