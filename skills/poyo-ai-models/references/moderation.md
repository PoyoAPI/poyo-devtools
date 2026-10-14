# moderation

Generated from PoYo Catalog `v1-4f660808dfbf`. Always call describe before execution.

| Model | Type | Protocols | Description |
|---|---|---|---|
| `omni-moderation-latest` | generate |  | Omni Moderation reviews text and HTTPS images asynchronously through OpenAI. FREE (0 credits). Submit through the unified generation API and poll task status or receive a callback with the complete OpenAI response in output. Streaming is not supported. |

Provide non-whitespace `prompt` text, one HTTPS image URL in the `image_urls` array, or both. `image_urls` accepts at most one image per request. Submit additional images as separate tasks.
