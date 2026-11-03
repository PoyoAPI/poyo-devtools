# Ideogram Vector 1.0

Use two model IDs. Describe the selected model before execution. Submit only fields the user selected.

`ideogram-vector-1.0/text-to-vector`: `prompt` is required, 1–9500 characters. Optional `image_urls` accepts 1–5 HTTP(S) reference images; the first is the primary reference. Omit `image_urls` when there is no reference image. An empty array is invalid. Defaults are `quality="medium"`, `n=1`, and `size="auto"`. `size` is an aspect ratio: `auto`, `1:1`, `1:4`, `1:3`, `1:2`, `9:16`, `10:16`, `2:3`, `3:4`, `4:5`, `5:4`, `4:3`, `3:2`, `16:10`, `16:9`, `2:1`, `3:1`, `4:1`. Do not send `mode`.

`ideogram-vector-1.0/image-to-vector`: `image_urls` must contain exactly one image. Optional `mode` is `default` or `simple`. Do not send `prompt`, `quality`, `n`, or `size`.

Do not send `seed`, `reference_image_urls`, `aspect_ratio`, `num_images`, `image_url`, `image_size`, or `sync_mode`.

```json
{
  "prompt": "A flat mountain travel poster",
  "image_urls": ["https://example.com/style.png"],
  "quality": "high",
  "size": "16:9",
  "n": 2
}
```

For CLI, save that object and run `poyo run ideogram-vector-1.0/text-to-vector --input-file vector.json --request-source skill`. For filtered MCP, use `poyo_ideogram_vector_1_0_text_to_vector` with the same fields and `_request_source="skill"`. Image conversion uses `poyo run ideogram-vector-1.0/image-to-vector` and `poyo_ideogram_vector_1_0_image_to_vector`. Query live pricing before generating multiple SVGs. Quality, count, and reference images can change a text-to-vector quote.
