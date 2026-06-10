# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Run in dev mode via ts-node (no build needed)
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled bot (after build)
npm run watch        # Watch and recompile on changes
```

No test or lint commands are configured.

## Architecture

This is a Discord bot with two interaction paths:

**1. Slash commands (reliable backup)** — handled in [src/interaction.ts](src/interaction.ts). Each command maps directly to a Notion CRUD operation via [src/storage.ts](src/storage.ts) using `@notionhq/client`. Only the basic commands are kept as a deterministic fallback that works even if the AI path is down: `/shop` and `/list-cart` (shopping), `/note` and `/list-notes` (notes).

**2. Message mentions (AI path)** — when the bot is @-mentioned, the message is sent to Claude via [src/claude.ts](src/claude.ts). Claude is called through the Anthropic Messages API with the **Notion remote MCP connector** (`mcp_servers` + `mcp_toolset`, beta header `mcp-client-2025-11-20`). Claude reads and writes the user's Notion workspace through the hosted Notion MCP server — so adding a new Notion database requires **no bot-side code changes**.

[src/index.ts](src/index.ts) sets up the Discord client, registers the slash commands, and starts an HTTP server on port 3000 for health checks (Render.com deployment compatibility).

## Required Environment Variables

Create a `.env` file at the project root:

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
ANTHROPIC_API_KEY=        # first-party Anthropic API key (api.anthropic.com)
NOTION_TOKEN=             # Notion integration token (used by the slash-command backup)
NOTION_DB_NOTES=          # Notion database id for notes (backup path)
NOTION_DB_SHOPPING_CART=  # Notion database id for shopping cart (backup path)
NOTION_MCP_TOKEN=         # optional, OAuth token for the Notion remote MCP server
NOTION_MCP_URL=           # optional, defaults to https://mcp.notion.com/mcp
CLAUDE_MODEL=             # optional, defaults to claude-sonnet-4-5
GUILD_ID=                 # optional, for dev guild-scoped command registration
PORT=3000                 # optional, defaults to 3000
```

## External Dependencies

- **Anthropic API** (`api.anthropic.com`) — the @mention path uses the MCP connector, which is a first-party Anthropic API feature (not available via AWS Bedrock).
- **Notion remote MCP** (`https://mcp.notion.com/mcp`) — Claude connects to this over OAuth to read/write Notion. The slash-command backup additionally uses `@notionhq/client` directly with `NOTION_TOKEN`.

## Notes

- The bot supports Chinese-language input — Claude is instructed to preserve Chinese characters exactly and reply in the user's language.
- Finance recording (`recordFinance` in [src/storage.ts](src/storage.ts) and [src/functions/recordFinance.ts](src/functions/recordFinance.ts)) is intentionally left in place for a later iteration; it is not yet wired into the AI path.
- New Notion databases are accessed by Claude through the MCP tools — no new `storage.ts` functions or slash commands are required for them.