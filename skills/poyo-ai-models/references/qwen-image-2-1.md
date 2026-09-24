# Qwen Image 2.1

Use `qwen-image-2.1` and inspect its current schema with describe before execution. Each request returns one image.

- Use `size`, `prompt_extend`, and `enable_safety_checker` for aspect ratio, prompt enhancement, and safety checking. `negative_prompt` and image-count parameters are unsupported.
- Omit `image_urls` or use `[]` for text-to-image. Otherwise provide 1–10 HTTP(S) image URLs in prompt order. JPEG, PNG, and WebP are supported, up to 30MB and 25MP per image; media limits are checked during generation.
- `size` supports `1:1`, `4:3`, `3:4`, `3:2`, `2:3`, `16:9`, `9:16`, `21:9`, and `9:21`. Image-to-image also supports `auto`. Omitted size defaults to `1:1` for text-to-image and `auto` for image-to-image.
- `resolution` supports `1K` (default) and `2K`. Output format defaults to `png`, background to `opaque`, and prompt enhancement and safety checking to `true`. Optional `seed` must be an integer.
- Set `background=transparent` with `output_format=png` or `webp`; JPEG cannot carry transparency. Describe the subject without background or scene details.
- `mask_url` requires exactly one reference image and an opaque background. White regions change and black regions remain. Match the reference aspect ratio; the mask is scaled to the reference dimensions. In mask mode, omit `size` and `prompt_extend` because they are ignored.
- Inspect current resolution pricing in the catalog. Reference image count and masks do not add a separate charge.
- Only pass parameters the user selected; do not expand schema defaults into the submitted input. Use `--output-format` for the image format; `--format` controls CLI output rendering.

```bash
poyo describe qwen-image-2.1
poyo run qwen-image-2.1 --prompt "A bilingual technology poster" --size 3:4 --resolution 1K --request-source skill
poyo run qwen-image-2.1 --prompt "A playful corgi sticker, isolated subject" --background transparent --output-format webp --request-source skill
poyo submit qwen-image-2.1 --prompt "Replace the marked cushion with blue velvet" --image-urls https://example.com/room.png --mask-url https://example.com/mask.png --resolution 2K --request-source skill
```

Replace example URLs with accessible user-provided images. For typed MCP, select `?models=qwen-image-2.1` and call `poyo_qwen_image_2_1` with `_request_source: "skill"`. Poll unfinished tasks with `poyo_check_job` without resubmitting them.
