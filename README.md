# PoYo Devtools

Official PoYo CLI, stdio MCP bridge, and Agent Skill. Model schemas and pricing are discovered from the hosted PoYo Capability Catalog.

## Workspace

- `@poyo/core`: Catalog, chat, generation-task, account, and credential client.
- `@poyo/cli`: Catalog-driven `poyo` command with chat SSE support.
- `@poyo/mcp`: Local stdio bridge to the hosted PoYo MCP server.
- `poyo-ai-models`: Agent workflow for discovering and safely executing PoYo models.

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

Refresh production artifacts before release:

```bash
POYO_BASE_URL=https://api.poyo.ai pnpm sync:catalog
pnpm generate:skills
pnpm skill:check
```
