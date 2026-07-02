#!/bin/bash
# =============================================================================
# Example 7: SQLite MCP Server
# =============================================================================
# Gives AI clients full SQL access to a local SQLite database file.
# Perfect for data analysis, prototyping, and local app databases.
# Also provides a built-in memo/note storage system.
#
# Official package: @modelcontextprotocol/server-sqlite
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
DB_PATH="${1:-$HOME/my-database.db}"   # Path to your SQLite .db file
PORT=3006
PASSWORD="my-secure-password"         # Change this!

echo "🗄️  Connecting to SQLite database: $DB_PATH"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

# The DB will be created if it doesn't exist
bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-sqlite \"$DB_PATH\"" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
