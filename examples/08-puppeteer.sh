#!/bin/bash
# =============================================================================
# Example 8: Puppeteer MCP Server
# =============================================================================
# Gives AI clients headless browser automation using Puppeteer.
# The AI can navigate, screenshot, scrape, interact with SPAs,
# and run JavaScript in a real browser context — no Chrome extension needed.
#
# Official package: @modelcontextprotocol/server-puppeteer
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer
#
# ⚠️  IMPORTANT: This server is STATEFUL (persistent browser session).
#     It will automatically use SSE transport to preserve the connection.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
PORT=3007
PASSWORD="my-secure-password"   # Change this!

echo "🤖 Starting Puppeteer MCP Server (headless Chrome)"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-puppeteer" \
  --port "$PORT" \
  --transport sse \
  --password "$PASSWORD"
