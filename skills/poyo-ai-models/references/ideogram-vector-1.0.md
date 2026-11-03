# Ideogram Vector 1.0

Use one model ID, `ideogram-vector-1.0`. Describe the mode before execution. Submit only fields the user selected.

Text to vector: omit `image_urls` or pass `[]`. `prompt` is required, 1–9500 characters. Optional `reference_image_urls` accepts 1–5 HTTP(S) images; the first is the primary reference. Reference images do not select image conversion. Defaults are `quality="medium"`, `n=1`, and `size="auto"`. `size` is an aspect ratio: `auto`, `1:1`, `1:4`, `1:3`, `1:2`, `9:16`, `10:16`, `2:3`, `3:4`, `4:5`, `5:4`, `4:3`, `3:2`, `16:10`, `16:9`, `2:1`, `3:1`, `4:1`. Do not send `mode`.

Image conversion: `image_urls` must contain exactly one image. Optional `mode` is `default` or `simple`. Do not send `prompt`, `reference_image_urls`, `quality`, `n`, or `size`.

Do not send `seed`, `aspect_ratio`, `num_images`, `image_url`, `image_size`, or `sync_mode`.

```json
{
  "prompt": "A flat mountain travel poster",
  "reference_image_urls": ["https://example.com/style.png"],
  "quality": "high",
  "size": "16:9",
  "n": 2
}
```

For CLI, save that object and run `poyo run ideogram-vector-1.0 --input-file vector.json --request-source skill`. For filtered MCP, use `poyo_ideogram_vector_1_0` with the same fields and `_request_source="skill"`. Query live pricing before generating multiple SVGs. Quality, count, and reference images can change a text-to-vector quote.
