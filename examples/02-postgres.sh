#!/bin/bash
# =============================================================================
# Example 2: PostgreSQL MCP Server
# =============================================================================
# Gives AI clients full SQL access to a PostgreSQL database.
# The AI can run queries, inspect schemas, and analyze data.
#
# Official package: @modelcontextprotocol/server-postgres
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/postgres
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="your-db-password"
DB_NAME="your-database"
TUNNEL_PORT=3001
PASSWORD="my-secure-password"   # Change this!

CONN_STRING="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "🐘 Connecting to PostgreSQL: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-postgres \"$CONN_STRING\"" \
  --port "$TUNNEL_PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
