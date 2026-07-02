#!/bin/bash
# =============================================================================
# Example 3: Browser Automation MCP Server (BrowserMCP)
# =============================================================================
# Gives AI clients control over a real Chrome browser session.
# The AI can navigate, click, fill forms, take screenshots, and scrape pages.
#
# Official package: @browsermcp/mcp
# Docs: https://browsermcp.io
#
# ⚠️  IMPORTANT: This server is STATEFUL (maintains a persistent browser session).
#     It will automatically use SSE transport to preserve the connection.
#
# Prerequisites:
#   1. Install the BrowserMCP Chrome Extension from:
#      https://chromewebstore.google.com/detail/browsermcp/... 
#   2. Keep Chrome open with the extension active.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
PORT=3002
PASSWORD="my-secure-password"   # Change this!

echo "🌐 Starting Browser MCP (stateful — uses SSE transport automatically)"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""
echo "⚠️  Make sure Chrome is open with the BrowserMCP extension installed!"
echo ""

bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @browsermcp/mcp@latest" \
  --port "$PORT" \
  --transport sse \
  --password "$PASSWORD"
