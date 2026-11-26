# PoYo Devtools

Official CLI, stdio MCP bridge, and Agent Skill for [PoYo](https://poyo.ai/), a unified API for AI video, image, audio, and chat models. Model schemas and pricing are discovered from the hosted PoYo Capability Catalog.

- Website: [poyo.ai](https://poyo.ai/)
- MCP server: [poyo.ai/mcp](https://poyo.ai/mcp) (Streamable HTTP at `https://api.poyo.ai/mcp`)
- Model catalog: [poyo.ai/models](https://poyo.ai/models)
- Documentation: [docs.poyo.ai](https://docs.poyo.ai/integrations/overview)
- API keys: [poyo.ai/dashboard/api-key](https://poyo.ai/dashboard/api-key)

## Quick start

Claude Code, connecting directly to the hosted MCP server:

```bash
claude mcp add --transport http poyo   https://api.poyo.ai/mcp   --header "Authorization: Bearer $POYO_API_KEY"
```

Claude Desktop, Cursor, and other stdio clients:

```json
{
  "mcpServers": {
    "poyo": {
      "command": "npx",
      "args": ["-y", "@poyoapi/mcp"],
      "env": { "POYO_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

As a Claude Code plugin (MCP server plus the `poyo-ai-models` skill):

```text
/plugin marketplace add PoyoAPI/poyo-devtools
/plugin install poyo@poyo-devtools
```

The plugin reads `POYO_API_KEY` from the environment that starts Claude Code.

Client-specific setup for [Claude](https://docs.poyo.ai/integrations/claude-desktop), [Cursor](https://docs.poyo.ai/integrations/cursor), and [Codex](https://docs.poyo.ai/integrations/codex) is in the docs. See [Connect with MCP](https://docs.poyo.ai/integrations/mcp) for the available tools and filters.

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

## Publishing to npm

The three public packages are published together with the same version:

- `@poyoapi/core`
- `@poyoapi/mcp`
- `@poyoapi/cli`

Configure an npm Trusted Publisher for each package with:

- Organization or user: `PoyoAPI`
- Repository: `poyo-devtools`
- Workflow: `publish.yml`
- Environment: `npm`

For a stable release, prepare and push the release commit:

```bash
pnpm release:stable -- 0.1.0
git push
```

Then run the **Publish npm packages** GitHub Actions workflow with:

```text
dist_tag: latest
confirmation: publish:0.1.0:latest
```

For a prerelease, set all package versions to the same prerelease version and
run the workflow with the `beta` tag, for example:

```text
dist_tag: beta
confirmation: publish:0.2.0-beta.1:beta
```

The workflow validates the version, refreshes the production catalog, builds
and tests the workspace, packs the packages in dependency order, and publishes
them with npm provenance. No long-lived `NPM_TOKEN` secret is required when the
Trusted Publishers are configured.
