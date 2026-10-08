# Nano Banana 2.1

Use model ID `nano-banana-2.1` for both text-to-image and image-to-image work. Add `image_urls` only when the user provides reference images. Up to 10 HTTP(S) image URLs are supported.

Required input: `prompt`. Optional inputs: `image_urls`, `size`, `resolution`. Keep these field names in MCP and CLI calls; do not substitute provider-specific names. Omitted `size` defaults to `auto` when `image_urls` are provided, otherwise `1:1`; omitted `resolution` defaults to `1K`. Use `auto` only for image editing. It lets the model choose an aspect ratio from the reference images; an explicit ratio overrides it.

| Input | Supported values |
|---|---|
| `size` | `auto` (editing only), `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | `1K`, `2K`, `4K` |

Example text-to-image input: `{"prompt":"An orange cat in a sunlit room","size":"1:1","resolution":"1K"}`.

Example image edit input: `{"prompt":"Keep the cat and change the room to a garden","image_urls":["https://example.com/cat.png"],"size":"auto","resolution":"2K"}`. Omit `size` for the same automatic aspect-ratio behavior.

Check the live catalog schema before submitting. For a timeout, check the original task ID before considering another paid request.
