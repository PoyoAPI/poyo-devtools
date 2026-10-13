# Ideogram V4.5

Describe `ideogram-v4.5` for generation or `ideogram-v4.5-edit` for editing before execution. Both use `prompt`, `size`, `n`, and `quality`. Do not send `seed`, `enable_prompt_expansion`, `image_size`, `num_images`, or `sync_mode`.

Generation defaults: `size="1:1 HD"`, `n=1`, `quality="medium"`. There are 36 supported exact `WIDTHxHEIGHT` values in the live schema, plus `1:1`, `1:1 HD`, `4:3`, `3:4`, `16:9`, and `9:16`. Quality accepts low/medium/high; count accepts 1–8.

Editing requires exactly one primary image in `image_urls`. Additional images belong in `reference_image_urls`: maximum four without a mask, three with a mask. Editing also supports `very_low` quality. A mask or `edit_precision="high"` requires omitted `size` or `size="auto"`; both default to auto size and regular precision. Regular unmasked custom sizes require dimensions at least 256, divisible by 32, at most 4,194,304 pixels, and aspect ratio at most 6:1. Masks must match the primary image dimensions and contain black edit regions and white preserved regions.

```json
{
  "prompt": "Replace the black masked area with flowers",
  "image_urls": ["https://example.com/room.png"],
  "mask_url": "https://example.com/mask.png",
  "reference_image_urls": ["https://example.com/flowers.png"],
  "edit_precision": "high"
}
```

For CLI, save that public input object and run `poyo run ideogram-v4.5-edit --input-file edit.json --request-source skill`. For filtered MCP, use `poyo_ideogram_v4_5_edit` with the same fields and `_request_source="skill"`. Query live pricing before generating multiple images; quality and count affect the quote.
