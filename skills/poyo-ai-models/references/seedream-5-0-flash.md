# Seedream 5.0 Flash

Use `seedream-5.0-flash` for text-to-image or `seedream-5.0-flash-edit` for image editing. Inspect the selected model with describe before execution. Each request returns one image.

- Public `size` is the output aspect ratio: `1:1`, `4:3`, `3:4`, `16:9`, `9:16`, `2:3`, `3:2`, or `21:9`. Omitted `size` uses `1:1`.
- Public `resolution` selects `1K`, `1.5K`, or `2K`. Omitted `resolution` uses `1K`. Do not swap `size` and `resolution`.
- `prompt` is required and limited to 5000 characters. Editing also requires 1–10 `image_urls`; omit `image_urls` for text-to-image.
- Optional `output_format` is `jpeg` or `png`. Optional `enable_safety_checker` defaults to `true`. Do not submit an image-count parameter; one image is returned.
- Pass only parameters the user selected. Use `--output-format` for image format; CLI `--format` controls terminal output. Inspect the catalog for the current credit charge.

```bash
poyo describe seedream-5.0-flash
poyo run seedream-5.0-flash --prompt "A colorful flower-shop poster" --size 3:4 --resolution 1.5K --request-source skill
poyo submit seedream-5.0-flash-edit --prompt "Place the product on the table" --image-urls https://example.com/table.jpg https://example.com/product.png --size 4:3 --resolution 2K --request-source skill
```

Replace example URLs with accessible user-provided images. For typed MCP, select `?models=seedream-5.0-flash` or `?models=seedream-5.0-flash-edit` and call `poyo_seedream_5_0_flash` or `poyo_seedream_5_0_flash_edit` with `_request_source: "skill"`. Poll unfinished tasks with `poyo_check_job` without resubmitting them.
