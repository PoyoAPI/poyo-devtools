# GPT Image 2.6 Fixed

Use `gpt-image-2.6-fixed`. Inspect the model with describe before execution. Each request returns one image.

- Public inputs are `prompt`, `version`, `resolution`, `size`, and `image_urls`.
- `version` is `flare` or `sunburst` and defaults to `flare`. Version does not change the credit price.
- Omit `image_urls` for generation, or provide up to 16 HTTP(S) reference images for editing. Reference images are not charged.
- Defaults are version `flare`, resolution `1K`, and size `1:1`.
- `size` is `auto`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `5:4`, `4:5`, or `21:9`.
- Resolution prices are 1.7 credits at `1K`, 6 at `2K`, and 8 at `4K`. Confirm the live catalog before an expensive run.
- Do not send image-count, quality, background, format, or mask controls. `prompt` must be non-empty and at most 32000 characters.

```bash
poyo describe gpt-image-2.6-fixed
poyo run gpt-image-2.6-fixed --prompt "A silver espresso machine in a bright studio" --size 3:2 --resolution 1K --request-source skill
poyo run gpt-image-2.6-fixed --prompt "Keep the product and replace the background with soft gray" --image-urls https://example.com/product.png --version sunburst --size 1:1 --request-source skill
```

For typed MCP tools, use `poyo_gpt_image_2_6_fixed` and `_request_source: "skill"`. Poll an unfinished task with `poyo_check_job` without resubmitting it.
