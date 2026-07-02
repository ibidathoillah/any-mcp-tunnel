#!/bin/bash
# =============================================================================
# Example 5: Brave Search MCP Server
# =============================================================================
# Gives AI clients real-time web search and local search capabilities
# via the Brave Search API. Privacy-respecting, no Google dependency.
#
# Official package: @modelcontextprotocol/server-brave-search
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search
#
# Prerequisites:
#   1. Get a free Brave Search API key at: https://brave.com/search/api/
#   2. The free tier allows 2,000 queries/month.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
BRAVE_API_KEY="BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
PORT=3004
PASSWORD="my-secure-password"   # Change this!

if [[ "$BRAVE_API_KEY" == BSAxx* ]]; then
  echo "❌ Error: Please set your Brave Search API key in this script."
  echo "   Get one at: https://brave.com/search/api/"
  exit 1
fi

echo "🔍 Starting Brave Search MCP Server"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

BRAVE_API_KEY="$BRAVE_API_KEY" \
bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-brave-search" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
