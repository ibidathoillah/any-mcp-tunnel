#!/bin/bash
# =============================================================================
# Example 6: Slack MCP Server
# =============================================================================
# Gives AI clients read/write access to your Slack workspace.
# The AI can send messages, read channels, search conversations, and more.
#
# Official package: @modelcontextprotocol/server-slack
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/slack
#
# Prerequisites:
#   1. Create a Slack App at: https://api.slack.com/apps
#   2. Add Bot Token Scopes: channels:history, channels:read, chat:write,
#      groups:history, groups:read, im:history, im:read, mpim:history,
#      mpim:read, users:read
#   3. Install the App to your workspace and copy the Bot Token (xoxb-...)
#   4. Copy the Team ID from your workspace URL: https://app.slack.com/client/T_TEAM_ID
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
SLACK_TEAM_ID="T0XXXXXXXXX"
PORT=3005
PASSWORD="my-secure-password"   # Change this!

if [[ "$SLACK_BOT_TOKEN" == *"your-slack-bot-token"* ]]; then
  echo "❌ Error: Please set your Slack Bot Token and Team ID in this script."
  echo "   Create a Slack App at: https://api.slack.com/apps"
  exit 1
fi

echo "💬 Starting Slack MCP Server"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN" \
SLACK_TEAM_ID="$SLACK_TEAM_ID" \
bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-slack" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
