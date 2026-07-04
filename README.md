<div align="center">

<h1>🛡️ any-mcp-tunnel</h1>

<p><strong>Tunnel any local stdio MCP server to the internet — securely.</strong></p>

<p>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-→-4CAF50?style=for-the-badge" alt="Quick Start"/></a>
  <a href="#-examples"><img src="https://img.shields.io/badge/Examples-10_MCPs-2196F3?style=for-the-badge" alt="Examples"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-9C27B0?style=for-the-badge" alt="MIT License"/></a>
</p>

<br/>

```
Local stdio MCP Server  →  supergateway  →  auth-proxy  →  Cloudflare Tunnel  →  Remote AI Client
```

</div>

---

**any-mcp-tunnel** wraps *any* stdio-based MCP server with:
- 🔐 **Password authentication** — via cookie (browser) or Bearer token (API/agent)
- 🌍 **Cloudflare Tunnel** — free `.trycloudflare.com` URL or your own custom domain
- 🔄 **Dual transport** — Streamable HTTP (`/mcp`) and SSE (`/sse` + `/message`)
- 🧹 **Auto-cleanup** — `trap` handlers kill background processes on exit

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [CLI Reference](#-cli-reference)
- [Connecting AI Clients](#-connecting-ai-clients)
- [Examples](#-examples)
  - [Filesystem](#1--filesystem)
  - [PostgreSQL](#2--postgresql)
  - [Browser Automation (BrowserMCP)](#3--browser-automation-browsermcp)
  - [GitHub](#4--github)
  - [Brave Search](#5--brave-search)
  - [Slack](#6--slack)
  - [SQLite](#7--sqlite)
  - [Puppeteer](#8--puppeteer)
  - [Google Maps](#9--google-maps)
  - [Everything (Demo)](#10--everything-demo-server)
  - [Desktop Commander](#11--desktop-commander)
- [Tunnel Types](#-tunnel-types)
- [Transport Types](#-transport-types)
- [Architecture](#-architecture)
- [Files](#-files)

---

## 📦 Prerequisites

| Requirement | Check |
|---|---|
| Node.js ≥ 18 | `node --version` |
| npx | `npx --version` |
| Bash | Pre-installed on macOS/Linux; Git Bash on Windows |

That's it. `cloudflared` and all MCP servers are fetched via `npx` automatically.

---

## ⚡ Quick Start

```bash
# Clone & make executable
git clone https://github.com/ibidathoillah/any-mcp-tunnel.git
cd any-mcp-tunnel
chmod +x any-mcp-tunnel.sh

# Run interactively — follow the prompts
./any-mcp-tunnel.sh

# Or run headlessly with CLI flags
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-filesystem ~/Documents" \
  --port 3000 \
  --transport streamableHttp \
  --password "mysecretpassword"
```

The script will print the public HTTPS URL and the Authorization header to use.

---

## 🔧 CLI Reference

```
./any-mcp-tunnel.sh [OPTIONS]
```

| Flag | Short | Description | Default |
|---|---|---|---|
| `--cmd` | `-c` | stdio command to run (e.g. `npx -y @wonderwhy-er/desktop-commander@latest`) | *(interactive)* |
| `--port` | `-p` | Public port for the auth proxy | `3000` |
| `--transport` | `-t` | `streamableHttp` or `sse` | `streamableHttp` |
| `--password` | `-w` | Password protecting the tunnel | *(auto-generated)* |
| `--tunnel-type` | `-y` | `quick`, `token`, or `named` | `quick` |
| `--tunnel-token` | `-o` | Cloudflare Zero Trust Tunnel token | *(required for `token`)* |
| `--tunnel-name` | `-n` | Locally configured tunnel name | *(required for `named`)* |

**Environment variables** — Alternative to `--password`:
```bash
export MCP_PASSWORD="my-secret"
./any-mcp-tunnel.sh --cmd "..."
```

---

## 🔌 Connecting AI Clients

Once the tunnel is live, you'll see output like:

```
--------------------------------------------------
📋 TO CONNECT YOUR REMOTE AI CLIENT:
   Endpoint URL: https://hungry-fox-123.trycloudflare.com/mcp
   ⚠️ IMPORTANT: You MUST add this custom header:
     Authorization: Bearer my-secret-password
--------------------------------------------------
```

### Cursor

Go to **Settings → Cursor Settings → MCP → Add new global MCP server**:

```json
{
  "mcpServers": {
    "my-remote-mcp": {
      "url": "https://hungry-fox-123.trycloudflare.com/mcp",
      "headers": {
        "Authorization": "Bearer my-secret-password"
      }
    }
  }
}
```

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-remote-mcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://hungry-fox-123.trycloudflare.com/mcp"],
      "env": {
        "MCP_REMOTE_AUTH_HEADER": "Authorization: Bearer my-secret-password"
      }
    }
  }
}
```

### Via URL Query Parameter (token in URL)

Alternatively, pass the password as a query parameter (useful for clients that don't support custom headers):

```
https://hungry-fox-123.trycloudflare.com/mcp?token=my-secret-password
```

---

## 📚 Examples

Ready-to-run example scripts live in the [`examples/`](./examples/) folder.
Edit the variables at the top of each script, then run:

```bash
bash examples/01-filesystem.sh
```

---

### 1. 📁 Filesystem

> Give your AI access to read, write, and manage files in a local directory.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-filesystem` |
| **Transport** | Streamable HTTP |
| **Auth needed** | None |

**Capabilities:** `list_directory`, `read_file`, `write_file`, `create_directory`, `move_file`, `search_files`, `get_file_info`

```bash
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-filesystem ~/Documents" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/01-filesystem.sh
EXPOSED_DIR="$HOME/Documents"
PORT=3000
PASSWORD="my-secure-password"

bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-filesystem \"$EXPOSED_DIR\"" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
```

</details>

---

### 2. 🐘 PostgreSQL

> Give your AI full SQL access to a PostgreSQL database — query, analyze, and modify data.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-postgres` |
| **Transport** | Streamable HTTP |
| **Auth needed** | PostgreSQL connection string |

**Capabilities:** `query` (any SQL), `list_tables`, `describe_table`

```bash
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-postgres postgresql://user:pass@localhost/mydb" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/02-postgres.sh
DB_HOST="localhost"
DB_USER="postgres"
DB_PASS="your-db-password"
DB_NAME="your-database"

CONN="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:5432/${DB_NAME}"

bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-postgres \"$CONN\"" \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

### 3. 🌐 Browser Automation (BrowserMCP)

> Give your AI control over a real Chrome browser — click, fill forms, take screenshots, scrape.

| | |
|---|---|
| **Package** | `@browsermcp/mcp` |
| **Transport** | **SSE** (stateful — auto-detected) |
| **Auth needed** | BrowserMCP Chrome Extension |

> ⚠️ **Stateful server.** The script auto-selects SSE transport to keep the browser session alive.

**Capabilities:** `navigate`, `click`, `type`, `screenshot`, `get_page_content`, `evaluate` (JS)

**Prerequisites:**
1. Install the [BrowserMCP Chrome Extension](https://chromewebstore.google.com/detail/browsermcp/ppagohhkobcpbpeecadhkbhbnoofkppp)
2. Keep Chrome open with the extension running

```bash
./any-mcp-tunnel.sh \
  --cmd "npx -y @browsermcp/mcp@latest" \
  --transport sse \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/03-browser.sh
bash any-mcp-tunnel.sh \
  --cmd "npx -y @browsermcp/mcp@latest" \
  --port 3002 \
  --transport sse \
  --password "my-password"
```

</details>

---

### 4. 🐙 GitHub

> Give your AI read/write access to GitHub — repos, issues, PRs, code search, and file management.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-github` |
| **Transport** | Streamable HTTP |
| **Auth needed** | [GitHub Personal Access Token](https://github.com/settings/tokens) |

**Capabilities:** `create_or_update_file`, `search_repositories`, `create_repository`, `get_file_contents`, `push_files`, `create_issue`, `create_pull_request`, `fork_repository`, `create_branch`, `list_commits`, `search_code`

**Token scopes required:** `repo`, `read:org`, `read:user`

```bash
GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxx" \
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-github" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/04-github.sh
GITHUB_TOKEN="ghp_your_token_here"

GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN" \
bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-github" \
  --port 3003 \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

### 5. 🔍 Brave Search

> Give your AI real-time web and local search via the privacy-respecting Brave Search API.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-brave-search` |
| **Transport** | Streamable HTTP |
| **Auth needed** | [Brave Search API Key](https://brave.com/search/api/) (free: 2,000 req/month) |

**Capabilities:** `brave_web_search` (with news, discussions, FAQ), `brave_local_search` (places, addresses)

```bash
BRAVE_API_KEY="BSA_xxxx" \
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-brave-search" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/05-brave-search.sh
BRAVE_API_KEY="BSAxxxxxxxxxxxxxxxxxx"

BRAVE_API_KEY="$BRAVE_API_KEY" \
bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-brave-search" \
  --port 3004 \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

### 6. 💬 Slack

> Give your AI read/write access to your Slack workspace — send messages, search conversations.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-slack` |
| **Transport** | Streamable HTTP |
| **Auth needed** | Slack Bot Token + Team ID |

**Capabilities:** `slack_list_channels`, `slack_post_message`, `slack_reply_to_thread`, `slack_get_channel_history`, `slack_search_messages`, `slack_get_users`

**Prerequisites:**
1. Create a [Slack App](https://api.slack.com/apps) and add Bot Token Scopes: `channels:history`, `channels:read`, `chat:write`, `groups:history`, `im:history`, `users:read`
2. Install to your workspace → copy the `xoxb-...` Bot Token

```bash
SLACK_BOT_TOKEN="xoxb-xxxx" SLACK_TEAM_ID="T0XXXXXX" \
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-slack" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/06-slack.sh
SLACK_BOT_TOKEN="xoxb-your-token"
SLACK_TEAM_ID="T0XXXXXXXXX"

SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN" SLACK_TEAM_ID="$SLACK_TEAM_ID" \
bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-slack" \
  --port 3005 \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

### 7. 🗄️ SQLite

> Give your AI full SQL access to a local `.db` file. Includes a built-in memo/notes storage.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-sqlite` |
| **Transport** | Streamable HTTP |
| **Auth needed** | None |

**Capabilities:** `read_query`, `write_query`, `create_table`, `list_tables`, `describe_table`, `append_insight`

```bash
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-sqlite ~/my-data.db" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/07-sqlite.sh
DB_PATH="$HOME/my-database.db"

bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-sqlite \"$DB_PATH\"" \
  --port 3006 \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

### 8. 🤖 Puppeteer

> Give your AI headless Chrome automation — no extension required. Scrape, screenshot, interact.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-puppeteer` |
| **Transport** | **SSE** (stateful — auto-detected) |
| **Auth needed** | None |

> ⚠️ **Stateful server.** Uses SSE transport to maintain the browser session.

**Capabilities:** `puppeteer_navigate`, `puppeteer_screenshot`, `puppeteer_click`, `puppeteer_fill`, `puppeteer_select`, `puppeteer_hover`, `puppeteer_evaluate`

```bash
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-puppeteer" \
  --transport sse \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/08-puppeteer.sh
bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-puppeteer" \
  --port 3007 \
  --transport sse \
  --password "my-password"
```

</details>

---

### 9. 🗺️ Google Maps

> Give your AI geocoding, place search, directions, and distance matrix via Google Maps Platform.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-google-maps` |
| **Transport** | Streamable HTTP |
| **Auth needed** | [Google Maps API Key](https://console.cloud.google.com/apis/credentials) |

**Capabilities:** `maps_geocode`, `maps_reverse_geocode`, `maps_search_places`, `maps_get_place_details`, `maps_get_directions`, `maps_distance_matrix`, `maps_elevation`

**APIs to enable:** Maps JavaScript API, Places API, Directions API, Geocoding API, Distance Matrix API, Elevation API

```bash
GOOGLE_MAPS_API_KEY="AIza_xxxx" \
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-google-maps" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/09-google-maps.sh
GOOGLE_MAPS_API_KEY="AIzaxxxxxxxxxxxxxxxx"

GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY" \
bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-google-maps" \
  --port 3008 \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

### 10. 🧪 Everything (Demo Server)

> A reference implementation that exercises all MCP primitives. Perfect for testing clients.

| | |
|---|---|
| **Package** | `@modelcontextprotocol/server-everything` |
| **Transport** | Streamable HTTP |
| **Auth needed** | None |

**Capabilities:** Resources (static, dynamic, templates), Prompts, Tools (`echo`, `add`, long-running ops), Subscriptions & Notifications

```bash
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-everything" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/10-everything-demo.sh
bash any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-everything" \
  --port 3009 \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

### 11. 🖥️ Desktop Commander

> Give your AI a real terminal + full filesystem access on your machine. The most powerful MCP for agentic coding and automation tasks.

| | |
|---|---|
| **Package** | `@wonderwhy-er/desktop-commander` |
| **Transport** | Streamable HTTP |
| **Auth needed** | None |

> ⚠️ **High privilege.** Desktop Commander can run any terminal command, read/write any file, and kill processes. Always use a strong password and only share with trusted clients.

**Capabilities:** `execute_command` (streaming terminal), `read_file`, `write_file`, `edit_block` (surgical diff edits), `search_code` (ripgrep), `list_directory`, `list_processes`, `kill_process`, `get_config`, `set_config`

```bash
./any-mcp-tunnel.sh \
  --cmd "npx -y @wonderwhy-er/desktop-commander@latest" \
  --transport streamableHttp \
  --password "my-password"
```

<details>
<summary>📄 See example script</summary>

```bash
# examples/11-desktop-commander.sh
bash any-mcp-tunnel.sh \
  --cmd "npx -y @wonderwhy-er/desktop-commander@latest" \
  --port 3010 \
  --transport streamableHttp \
  --password "my-password"
```

</details>

---

## ☁️ Tunnel Types

| Type | Flag | Domain | Requirement |
|---|---|---|---|
| **TryCloudflare** (default) | `--tunnel-type quick` | Random `.trycloudflare.com` | None — zero setup |
| **Zero Trust Token** | `--tunnel-type token` | Your custom domain | Cloudflare account + tunnel token |
| **Named Tunnel** | `--tunnel-type named` | Your custom domain | `cloudflared login` locally |

### Using a Custom Domain

```bash
# Option A: Token-based (Zero Trust Dashboard)
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-filesystem ~/Documents" \
  --tunnel-type token \
  --tunnel-token "YOUR_CF_TUNNEL_TOKEN" \
  --password "my-password"

# Option B: Named tunnel (local config)
./any-mcp-tunnel.sh \
  --cmd "npx -y @modelcontextprotocol/server-filesystem ~/Documents" \
  --tunnel-type named \
  --tunnel-name "my-mcp-tunnel" \
  --password "my-password"
```

---

## 🔄 Transport Types

| Transport | Path | Best for |
|---|---|---|
| **Streamable HTTP** | `/mcp` | Stateless servers (filesystem, DB, search, etc.) |
| **SSE** | `/sse` + `/message` | Stateful servers (browser, puppeteer) |

> 💡 **Auto-detection:** The script automatically selects SSE for stateful servers (browser, puppeteer, playwright, etc.).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Machine                             │
│                                                                 │
│  ┌──────────────────┐    stdio    ┌──────────────────────────┐ │
│  │   MCP Server     │◄──────────►│      supergateway        │ │
│  │ (filesystem, DB, │            │  (stdio → HTTP bridge)   │ │
│  │  GitHub, etc.)   │            │  :3001 (internal)        │ │
│  └──────────────────┘            └────────────┬─────────────┘ │
│                                               │ HTTP           │
│                                  ┌────────────▼─────────────┐ │
│                                  │       auth-proxy.js      │ │
│                                  │  (password + login page) │ │
│                                  │  :3000 (public)          │ │
│                                  └────────────┬─────────────┘ │
│                                               │ HTTP           │
│                                  ┌────────────▼─────────────┐ │
│                                  │   cloudflared tunnel     │ │
│                                  └────────────┬─────────────┘ │
└───────────────────────────────────────────────┼───────────────┘
                                                │ HTTPS
                               ┌────────────────▼────────────────┐
                               │  https://xxxx.trycloudflare.com │
                               │     /mcp  (Streamable HTTP)     │
                               │     /sse  (SSE endpoint)        │
                               │     /     (Login page)          │
                               └─────────────────────────────────┘
                                                │
                               ┌────────────────▼────────────────┐
                               │      Remote AI Client           │
                               │  (Cursor, Claude Desktop, etc.) │
                               └─────────────────────────────────┘
```

---

## 📂 Files

| File | Description |
|---|---|
| `any-mcp-tunnel.sh` | Main launcher: interactive prompts + CLI flags, manages all processes |
| `auth-proxy.js` | Node.js reverse proxy: cookie login page, Bearer token validation, request forwarding |
| `examples/01-filesystem.sh` | Filesystem MCP example |
| `examples/02-postgres.sh` | PostgreSQL MCP example |
| `examples/03-browser.sh` | BrowserMCP (Chrome extension) example |
| `examples/04-github.sh` | GitHub MCP example |
| `examples/05-brave-search.sh` | Brave Search MCP example |
| `examples/06-slack.sh` | Slack MCP example |
| `examples/07-sqlite.sh` | SQLite MCP example |
| `examples/08-puppeteer.sh` | Puppeteer (headless Chrome) example |
| `examples/09-google-maps.sh` | Google Maps MCP example |
| `examples/10-everything-demo.sh` | Everything demo/test server example |
| `examples/11-desktop-commander.sh` | Desktop Commander (terminal + filesystem) example |

---

## 📄 License

MIT © [ibidathoillah](https://github.com/ibidathoillah)
