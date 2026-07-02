# any-mcp-tunnel

A general-purpose tool to tunnel **any** local stdio-based Model Context Protocol (MCP) server securely to the internet via Cloudflare Quick Tunnels (`trycloudflare`). It protects the exposed endpoints with a secure password-based authentication proxy (via Web interface, Cookies, and Bearer Tokens).

## Features

1. **Expose Any Local stdio MCP Server**: Run SQLite, Postgres, Filesystem, or custom browser automation servers locally, and access them from remote clients.
2. **Double Authentication Modes**:
   - **Web Browsers**: Interactive glassmorphism-themed webpage login that sets secure HTTP cookies.
   - **API / AI Agents**: Standard `Authorization: Bearer <password>` header validation or `?token=<password>` query parameters.
3. **Multi-Protocol Support**: Exposes endpoints via standard **Streamable HTTP** (served on `/mcp`) or **SSE** (served on `/sse` and `/message`).
4. **Auto-Cleanup**: Uses Bash `trap` handlers to cleanly shut down background node processes when you exit.

## Files

- `any-mcp-tunnel.sh` — The launcher script supporting interactive setup and programmatic CLI flags.
- `auth-proxy.js` — The Node.js reverse proxy that validates credentials and serves the login interface.

## Prerequisites

- Node.js & `npx` installed.

## Usage

### Run Interactively
Simply execute the script and follow the prompts:
```bash
./any-mcp-tunnel.sh
```

### Run Programmatically (CLI Flags)
To bypass prompts (ideal for automated environments or starting up quickly):
```bash
./any-mcp-tunnel.sh --cmd "npx -y @browsermcp/mcp@latest" --port 3000 --transport streamableHttp --password mysecurepassword123
```

#### Available CLI Options:
* `-c` or `--cmd`: The local stdio command to run (e.g. `npx -y @browsermcp/mcp@latest`).
* `-p` or `--port`: Port to listen on (default `3000`).
* `-t` or `--transport`: Output transport type (`streamableHttp` or `sse`).
* `-w` or `--password`: Custom password to protect the endpoint.

## Connecting Remote AI Clients

Once the tunnel initializes, `cloudflared` generates a random `.trycloudflare.com` URL. Configure your AI client settings using these parameters:

### Using Streamable HTTP (Default)
- **Endpoint URL**: `https://[YOUR-SUBDOMAIN].trycloudflare.com/mcp`
- **Required Header**: `Authorization: Bearer <password>`

### Using SSE
- **SSE Endpoint**: `https://[YOUR-SUBDOMAIN].trycloudflare.com/sse`
- **Message Endpoint**: `https://[YOUR-SUBDOMAIN].trycloudflare.com/message`
- **Required Header**: `Authorization: Bearer <password>`

---

## License
MIT
