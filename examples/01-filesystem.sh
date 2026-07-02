#!/bin/bash
# =============================================================================
# Example 1: Filesystem MCP Server
# =============================================================================
# Gives AI clients read/write access to a local directory.
# The AI can list, read, write, move, and delete files.
#
# Official package: @modelcontextprotocol/server-filesystem
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
# =============================================================================

# Go to the root of the tunnel script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
EXPOSED_DIR="${1:-$HOME/Documents}"   # Directory to expose (default: ~/Documents)
PORT=3000
PASSWORD="my-secure-password"        # Change this!

echo "📁 Exposing directory: $EXPOSED_DIR"
echo "🔒 Protected with password: $PASSWORD"
echo ""

bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-filesystem \"$EXPOSED_DIR\"" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
