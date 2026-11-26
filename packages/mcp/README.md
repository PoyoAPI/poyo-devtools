# @poyoapi/mcp

stdio bridge to the hosted [PoYo MCP server](https://poyo.ai/mcp) at `https://api.poyo.ai/mcp`. It lets MCP clients search [PoYo](https://poyo.ai/)'s model catalog, inspect schemas and prices, run video, image, audio, and chat models, and poll generation tasks.

Get an API key from the [PoYo dashboard](https://poyo.ai/dashboard/api-key). Node.js 20 or later is required.

```bash
POYO_API_KEY=... npx @poyoapi/mcp
```

Optional filters:

- `POYO_MCP_CATEGORIES` or `--categories`
- `POYO_MCP_MODELS` or `--models`

Configure categories or models, never both.

Setup guides for each client are in the [PoYo MCP documentation](https://docs.poyo.ai/integrations/mcp).
