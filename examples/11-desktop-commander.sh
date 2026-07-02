#!/bin/bash
# =============================================================================
# Example 11: Desktop Commander MCP Server
# =============================================================================
# Gives AI clients full control over your desktop — execute terminal commands,
# manage processes, read/write files, and edit code with surgical precision.
# Think of it as giving your AI a real terminal + file editor on your machine.
#
# Official package: @wonderwhy-er/desktop-commander
# Docs: https://github.com/wonderwhy-er/DesktopCommanderMCP
#
# ⚙️  Capabilities:
#   - execute_command       — Run any terminal command with streaming output
#   - read_file / write_file — Full file read/write with large file support
#   - edit_block            — Surgical code edits (diff-style, no full rewrites)
#   - search_code           — ripgrep-powered search across your codebase
#   - list_directory        — Browse filesystem tree
#   - get_config / set_config — Manage server settings (allowed paths, shell, etc.)
#   - list_processes        — View running system processes
#   - kill_process          — Terminate processes by PID
#   - block_on_output       — Wait for and stream long-running command output
#
# ⚠️  SECURITY NOTE:
#   Desktop Commander gives broad system access. Always:
#   - Use a strong, random password
#   - Share the tunnel URL only with trusted parties
#   - Restrict allowed paths via set_config if needed
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ⚙️  Configure these before running:
PORT=3010
PASSWORD="my-secure-password"   # Change this! Use a strong random password.

echo "🖥️  Starting Desktop Commander MCP Server"
echo "   (Full terminal + file system access)"
echo "🔒 Tunnel protected with password: $PASSWORD"
echo ""
echo "⚠️  Desktop Commander has broad system access."
echo "   Only share this tunnel URL with trusted clients."
echo ""

bash "$SCRIPT_DIR/any-mcp-tunnel.sh" \
  --cmd "npx -y @wonderwhy-er/desktop-commander@latest" \
  --port "$PORT" \
  --transport streamableHttp \
  --password "$PASSWORD"
