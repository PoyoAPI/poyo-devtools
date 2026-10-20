# Flux 3 Klein

Describe the live model before execution. Use `flux-3-klein` for text-to-image or `flux-3-klein-edit` with 1-10 HTTP(S) URLs in `image_urls` for reference editing. Both require `prompt`. Editing references follow their order in the array.

Use public inputs `prompt`, `size`, `resolution`, `n`, `output_format`, and `enable_safety_checker`; only the editing model accepts `image_urls`. Supply only fields selected by the user.

- `size` accepts `1:1`, `4:3`, `3:4`, `16:9`, `9:16`, `3:2`, or `2:3`, defaulting to `1:1` in both models.
- `resolution` accepts `1K` (default), `2K`, or `4K`. Aspect-ratio sizes have a 1024, 2048, or 4096 pixel long edge; the short edge is rounded to the nearest multiple of 16.
- Exact `WIDTHxHEIGHT` sizes require each side to be 256-4096 pixels and divisible by 16. Supply `resolution` explicitly: long edge at most 1024 uses `1K`, above 1024 through 2048 uses `2K`, above 2048 through 4096 uses `4K`. For example, `1536x1024` uses `2K`.
- `n` is 1-4, defaulting to 1. `output_format` is `png` (default), `jpeg`, or `webp`. Safety checking defaults to true; use `enable_safety_checker: false` only when selected by the user.

A CLI edit can use:

```bash
poyo run flux-3-klein-edit --prompt "Place the product in a sunlit studio" --image-urls https://example.com/product.png --size 4:3 --resolution 2K --format json --request-source skill
```

On filtered MCP, tools are `poyo_flux_3_klein` and `poyo_flux_3_klein_edit`. Keep `callback_url` outside model input on submission. Inspect live pricing; requested image count and resolution determine the charge.
