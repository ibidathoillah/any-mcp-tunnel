#!/bin/bash
# =============================================================================
# Example 10: Everything MCP Demo Server
# =============================================================================
# A reference/demo implementation that showcases ALL MCP capabilities:
# - Resources (static files, dynamic content, templates)
# - Prompts (pre-defined AI prompts)
# - Tools (echo, add, long-running operations, sampling)
# - Subscriptions & notifications
#
# Official package: @modelcontextprotocol/server-everything
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/everything
#
# 💡 Use this to test your MCP client setup before connecting a real server.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
PORT=3009
PASSWORD="my-secure-password"   # Change this!

echo "🧪 Starting 'Everything' MCP Demo Server"
echo "   (Tests all MCP primitives: resources, prompts, tools, subscriptions)"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-everything" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
