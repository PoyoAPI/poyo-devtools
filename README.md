# PoYo Devtools

Official PoYo CLI, stdio MCP bridge, and Agent Skill. Model schemas and pricing are discovered from the hosted PoYo Capability Catalog.

## Workspace

- `@poyoapi/core`: Catalog, chat, generation-task, account, and credential client.
- `@poyoapi/cli`: Catalog-driven `poyo` command with chat SSE support.
- `@poyoapi/mcp`: Local stdio bridge to the hosted PoYo MCP server.
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
pnpm sync:catalog
pnpm generate:skills
pnpm skill:check
```
