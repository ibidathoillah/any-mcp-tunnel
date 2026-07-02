#!/bin/bash
# =============================================================================
# Example 9: Google Maps MCP Server
# =============================================================================
# Gives AI clients geocoding, directions, places search, and distance matrix
# capabilities via the Google Maps Platform API.
#
# Official package: @modelcontextprotocol/server-google-maps
# Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps
#
# Prerequisites:
#   1. Enable the following APIs in Google Cloud Console:
#      - Maps JavaScript API
#      - Places API
#      - Directions API
#      - Geocoding API
#      - Distance Matrix API
#   2. Create an API key at: https://console.cloud.google.com/apis/credentials
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
GOOGLE_MAPS_API_KEY="AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
PORT=3008
PASSWORD="my-secure-password"   # Change this!

if [[ "$GOOGLE_MAPS_API_KEY" == AIzaxx* ]]; then
  echo "❌ Error: Please set your Google Maps API key in this script."
  echo "   Get one at: https://console.cloud.google.com/apis/credentials"
  exit 1
fi

echo "🗺️  Starting Google Maps MCP Server"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""

GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY" \
bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @modelcontextprotocol/server-google-maps" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
