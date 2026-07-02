#!/bin/bash
# =============================================================================
# Example 4: GitHub MCP Server
# =============================================================================
# Gives AI clients access to GitHub: repos, issues, PRs, code search, and more.
# The AI can create/update files, open PRs, comment on issues, and clone repos.
#
# Official package: @modelcontextprotocol/server-github
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/github
#
# Prerequisites:
#   1. Create a GitHub Personal Access Token at:
#      https://github.com/settings/tokens
#   2. Grant scopes: repo, read:org, read:user
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
GITHUB_TOKEN="ghp_your_github_personal_access_token"
PORT=3003
PASSWORD="my-secure-password"   # Change this!

if [ "$GITHUB_TOKEN" = "ghp_your_github_personal_access_token" ]; then
  echo "❌ Error: Please set your GitHub Personal Access Token in this script."
  echo "   Get one at: https://github.com/settings/tokens"
  exit 1
fi

echo "🐙 Starting GitHub MCP Server"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN" \
bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-github" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
