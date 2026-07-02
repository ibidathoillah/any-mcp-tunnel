#!/bin/bash

# Configuration defaults
DEFAULT_PORT=3000
DEFAULT_TRANSPORT="streamableHttp"

echo "=================================================="
echo "🛡️  any-mcp-tunnel: Tunnel Any Local MCP Server"
echo "=================================================="

# Check if node and npx are installed
if ! command -v node &> /dev/null || ! command -v npx &> /dev/null; then
  echo "❌ Error: Node.js and npx are required but not installed."
  exit 1
fi

# Parse command-line options
COMMAND=""
PORT=""
TRANSPORT=""
PASSWORD=""
TUNNEL_TYPE=""
TUNNEL_TOKEN=""
TUNNEL_NAME=""
CUSTOM_DOMAIN=""

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -c|--cmd) COMMAND="$2"; shift ;;
    -p|--port) PORT="$2"; shift ;;
    -t|--transport) TRANSPORT="$2"; shift ;;
    -w|--password) PASSWORD="$2"; shift ;;
    -y|--tunnel-type) TUNNEL_TYPE="$2"; shift ;;
    -o|--tunnel-token) TUNNEL_TOKEN="$2"; shift ;;
    -n|--tunnel-name) TUNNEL_NAME="$2"; shift ;;
    -d|--custom-domain) CUSTOM_DOMAIN="$2"; shift ;;
    *) echo "Unknown parameter passed: $1"; exit 1 ;;
  esac
  shift
done

# 1. Choose MCP Server Command (if not provided)
if [ -z "$COMMAND" ]; then
  echo "Select the MCP server you want to run:"
  echo "1) Browser MCP (npx -y @browsermcp/mcp@latest)"
  echo "2) Filesystem MCP (npx -y @modelcontextprotocol/server-filesystem)"
  echo "3) Postgres MCP (npx -y @modelcontextprotocol/server-postgres)"
  echo "4) Custom stdio command"
  echo -n "Enter selection (1-4) [default: 1]: "
  read -r SELECTION

  case "$SELECTION" in
    2)
      echo -n "Enter the absolute directory path to expose: "
      read -r DIR_PATH
      if [ -z "$DIR_PATH" ]; then
        echo "❌ Error: Directory path is required for filesystem MCP."
        exit 1
      fi
      COMMAND="npx -y @modelcontextprotocol/server-filesystem \"$DIR_PATH\""
      ;;
    3)
      echo -n "Enter PostgreSQL connection string (postgresql://...): "
      read -r CONN_STR
      if [ -z "$CONN_STR" ]; then
        echo "❌ Error: Connection string is required for Postgres MCP."
        exit 1
      fi
      COMMAND="npx -y @modelcontextprotocol/server-postgres \"$CONN_STR\""
      ;;
    4)
      echo -n "Enter custom command (e.g. 'node my-server.js'): "
      read -r COMMAND
      if [ -z "$COMMAND" ]; then
        echo "❌ Error: Command is required."
        exit 1
      fi
      ;;
    *)
      COMMAND="npx -y @browsermcp/mcp@latest"
      ;;
  esac
fi

echo "✅ Using command: $COMMAND"
echo ""

# 2. Choose Transport Type (if not provided)
if [ -z "$TRANSPORT" ]; then
  echo "Select the output transport type:"
  echo "1) Streamable HTTP on /mcp (Recommended for Cursor/Claude Desktop)"
  echo "2) Server-Sent Events (SSE) on /sse and /message"
  echo -n "Enter selection (1-2) [default: 1]: "
  read -r TRANSPORT_SELECTION

  if [ "$TRANSPORT_SELECTION" = "2" ]; then
    TRANSPORT="sse"
  else
    TRANSPORT="streamableHttp"
  fi
fi

if [ "$TRANSPORT" = "sse" ]; then
  PATH_INFO="/sse and /message"
  SUPERGATEWAY_FLAGS="--outputTransport sse"
else
  TRANSPORT="streamableHttp"
  PATH_INFO="/mcp"
  SUPERGATEWAY_FLAGS="--outputTransport streamableHttp --streamableHttpPath /mcp --stateful"
fi

# Choose Cloudflare Tunnel Type (if not provided)
if [ -z "$TUNNEL_TYPE" ]; then
  echo "Select the Cloudflare Tunnel type:"
  echo "1) TryCloudflare (Free, random subdomain, no account required) [default]"
  echo "2) Cloudflare Tunnel (Token-based, managed via Zero Trust Dashboard)"
  echo "3) Cloudflare Tunnel (Named tunnel, configured locally)"
  echo -n "Enter selection (1-3) [default: 1]: "
  read -r TUNNEL_SELECTION

  case "$TUNNEL_SELECTION" in
    2) TUNNEL_TYPE="token" ;;
    3) TUNNEL_TYPE="named" ;;
    *) TUNNEL_TYPE="quick" ;;
  esac
fi

if [ "$TUNNEL_TYPE" = "token" ]; then
  if [ -z "$TUNNEL_TOKEN" ]; then
    echo -n "Enter your Cloudflare Tunnel Token: "
    read -r TUNNEL_TOKEN
    if [ -z "$TUNNEL_TOKEN" ]; then
      echo "❌ Error: Tunnel Token is required for token-based tunnel."
      exit 1
    fi
  fi
elif [ "$TUNNEL_TYPE" = "named" ]; then
  # 1. Check if logged in (cert.pem exists)
  CERT_PATH="$HOME/.cloudflared/cert.pem"
  if [ ! -f "$CERT_PATH" ]; then
    echo "⚠️  Cloudflare credentials not found at $CERT_PATH."
    echo "   Starting Cloudflare login..."
    npx -y cloudflared tunnel login
    if [ ! -f "$CERT_PATH" ]; then
      echo "❌ Error: Cloudflare login was not completed. cert.pem is missing."
      exit 1
    fi
  fi

  # 2. Get Tunnel Name
  if [ -z "$TUNNEL_NAME" ]; then
    echo -n "Enter your Cloudflare Tunnel Name [default: any-mcp-tunnel]: "
    read -r TUNNEL_NAME
    TUNNEL_NAME=${TUNNEL_NAME:-any-mcp-tunnel}
  fi

  # 3. Get Custom Domain
  if [ -z "$CUSTOM_DOMAIN" ]; then
    echo -n "Enter your Custom Domain (e.g. mcp.example.com): "
    read -r CUSTOM_DOMAIN
    if [ -z "$CUSTOM_DOMAIN" ]; then
      echo "❌ Error: Custom Domain is required for locally configured tunnel."
      exit 1
    fi
  fi

  # 4. Check if tunnel already exists, if not, create it
  echo "🔍 Checking if tunnel '$TUNNEL_NAME' exists..."
  if ! npx -y cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
    echo "🏗️  Tunnel '$TUNNEL_NAME' does not exist. Creating it..."
    npx -y cloudflared tunnel create "$TUNNEL_NAME"
  else
    echo "✅ Tunnel '$TUNNEL_NAME' already exists."
  fi

  # 5. Auto-route DNS
  echo "🌐 Auto-routing DNS for '$CUSTOM_DOMAIN' to tunnel '$TUNNEL_NAME'..."
  npx -y cloudflared tunnel route dns "$TUNNEL_NAME" "$CUSTOM_DOMAIN"
fi

# 3. Configure Ports
PORT=${PORT:-$DEFAULT_PORT}
INTERNAL_PORT=$((PORT + 1))

# 4. Configure Password
if [ -z "$PASSWORD" ] && [ -n "$MCP_PASSWORD" ]; then
  PASSWORD="$MCP_PASSWORD"
fi

if [ -z "$PASSWORD" ]; then
  echo -n "Enter password to protect the tunnel (press Enter to generate a random one): "
  read -s PASSWORD
  echo ""
fi

if [ -z "$PASSWORD" ]; then
  PASSWORD=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | fold -w 12 | head -n 1)
  if [ -z "$PASSWORD" ]; then
    PASSWORD="mcp-secure-pass-$(date +%s)"
  fi
  echo "🔑 Generated random password: $PASSWORD"
else
  echo "🔑 Using password authorization."
fi

# Function to check if a port is in use
is_port_in_use() {
  lsof -i :"$1" >/dev/null 2>&1
}

# Check ports
if is_port_in_use "$WS_PORT"; then
  echo "⚠️  Port $WS_PORT (used by @browsermcp/mcp for the browser extension) is in use. Freeing it up..."
  lsof -ti :"$WS_PORT" | xargs kill -9 >/dev/null 2>&1
  sleep 1
fi

if is_port_in_use "$PORT"; then
  echo "❌ Error: Public port $PORT is already in use. Please specify a different port."
  exit 1
fi

if is_port_in_use "$INTERNAL_PORT"; then
  echo "❌ Error: Internal port $INTERNAL_PORT is already in use. Please free up this port."
  exit 1
fi

# Start supergateway on internal port
echo "🔄 Starting supergateway with transport '$TRANSPORT' on port $INTERNAL_PORT..."
npx -y supergateway --port "$INTERNAL_PORT" $SUPERGATEWAY_FLAGS --stdio "$COMMAND" > supergateway.log 2>&1 &
GATEWAY_PID=$!

# Start auth proxy on public port
echo "🛡️  Starting auth proxy on port $PORT..."
export MCP_PASSWORD="$PASSWORD"
export PORT="$PORT"
export TARGET_PORT="$INTERNAL_PORT"
node auth-proxy.js > auth-proxy.log 2>&1 &
PROXY_PID=$!

# Ensure cleanup of background processes on exit
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  if kill -0 "$GATEWAY_PID" 2>/dev/null; then
    kill "$GATEWAY_PID"
    wait "$GATEWAY_PID" 2>/dev/null
  fi
  if kill -0 "$PROXY_PID" 2>/dev/null; then
    kill "$PROXY_PID"
    wait "$PROXY_PID" 2>/dev/null
  fi
  rm -f supergateway.log auth-proxy.log
  echo "✅ Done. Goodbye!"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Wait a short moment to ensure services started successfully
sleep 2
if ! kill -0 "$GATEWAY_PID" 2>/dev/null; then
  echo "❌ Error: Failed to start supergateway. Check logs below:"
  cat supergateway.log
  exit 1
fi

if ! kill -0 "$PROXY_PID" 2>/dev/null; then
  echo "❌ Error: Failed to start auth proxy. Check logs below:"
  cat auth-proxy.log
  exit 1
fi

echo "✅ Auth proxy is running locally on http://localhost:$PORT"
echo ""
echo "🔄 Starting Cloudflare Tunnel..."
echo "--------------------------------------------------"
echo "📋 TO CONNECT YOUR REMOTE AI CLIENT:"

if [ "$TUNNEL_TYPE" = "token" ] || [ "$TUNNEL_TYPE" = "named" ]; then
  DISPLAY_DOMAIN=${CUSTOM_DOMAIN:-"[YOUR-CUSTOM-DOMAIN]"}
  echo "   Use the Custom Domain configured for your Cloudflare Tunnel."
  if [ "$TRANSPORT" = "streamableHttp" ]; then
    echo "     - Endpoint URL: https://$DISPLAY_DOMAIN/mcp"
  else
    echo "     - Endpoint URL: https://$DISPLAY_DOMAIN/sse"
    echo "     - Message URL:  https://$DISPLAY_DOMAIN/message"
  fi
else
  echo "   Use the '.trycloudflare.com' URL generated below."
  if [ "$TRANSPORT" = "streamableHttp" ]; then
    echo "     - Endpoint URL: https://[YOUR-SUBDOMAIN].trycloudflare.com/mcp"
  else
    echo "     - Endpoint URL: https://[YOUR-SUBDOMAIN].trycloudflare.com/sse"
    echo "     - Message URL:  https://[YOUR-SUBDOMAIN].trycloudflare.com/message"
  fi
fi

echo ""
echo "   ⚠️ IMPORTANT: You MUST add this custom header to your client settings:"
echo "     Authorization: Bearer $PASSWORD"
echo "--------------------------------------------------"

# Start cloudflared
if [ "$TUNNEL_TYPE" = "token" ]; then
  npx -y cloudflared tunnel --protocol http2 run --token "$TUNNEL_TOKEN"
elif [ "$TUNNEL_TYPE" = "named" ]; then
  npx -y cloudflared tunnel --protocol http2 run --url "http://localhost:$PORT" "$TUNNEL_NAME"
else
  npx -y cloudflared tunnel --protocol http2 --url "http://localhost:$PORT"
fi
