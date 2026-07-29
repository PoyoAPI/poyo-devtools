# Chat protocols

- `openai-chat`: OpenAI-compatible `/v1/chat/completions`.
- `openai-responses`: OpenAI-compatible `/v1/responses`.
- `anthropic`: Anthropic-compatible `/v1/messages`.
- `gemini`: Gemini `generateContent` or `streamGenerateContent`.

MCP chat is non-streaming. Use `poyo chat MODEL --protocol PROTOCOL --stream` for SSE.
