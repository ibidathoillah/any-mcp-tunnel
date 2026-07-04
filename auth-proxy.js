import http from 'http';
import { URL, URLSearchParams } from 'url';
import { spawn } from 'child_process';
import readline from 'readline';

const PASSWORD = process.env.MCP_PASSWORD;
const PORT = parseInt(process.env.PORT || '3000', 10);
const TARGET_PORT = process.env.TARGET_PORT ? parseInt(process.env.TARGET_PORT, 10) : null;
const COMMAND = process.env.COMMAND || 'npx -y @wonderwhy-er/desktop-commander@latest';

if (!PASSWORD) {
  console.error("Error: MCP_PASSWORD environment variable is required");
  process.exit(1);
}

let child = null;
const oauthCodes = new Map();
const sseClients = new Set();

// If no TARGET_PORT is provided, act as a self-contained SSE gateway and spawn the process directly
if (!TARGET_PORT) {
  console.log(`[Proxy] Spawning MCP server command: "${COMMAND}"`);
  child = spawn(COMMAND, {
    shell: true,
    stdio: ['pipe', 'pipe', 'inherit']
  });

  child.on('error', (err) => {
    console.error(`[Proxy] Failed to start MCP child process: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`[Proxy] MCP child process exited with code ${code}, signal ${signal}`);
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    if (child) child.kill('SIGINT');
    process.exit();
  });
  process.on('SIGTERM', () => {
    if (child) child.kill('SIGTERM');
    process.exit();
  });

  // Read line-by-line from the child process's stdout
  const rl = readline.createInterface({ input: child.stdout });
  rl.on('line', (line) => {
    console.log(`[Child Stdout] -> ${line}`);
    // Broadcast stdout line to all connected SSE clients
    for (const client of sseClients) {
      try {
        client.res.write(`event: message\ndata: ${line}\n\n`);
      } catch (err) {
        console.error(`[Proxy] Error writing to client ${client.sessionId}: ${err.message}`);
      }
    }
  });
}

// Inline Login Page HTML/CSS (supports both standard and OAuth authorization flows)
const LOGIN_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser MCP Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --card-bg: rgba(255, 255, 255, 0.03);
            --card-border: rgba(255, 255, 255, 0.08);
            --primary: #8b5cf6;
            --primary-hover: #a78bfa;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --error: #ef4444;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.15) 0px, transparent 50%);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .login-container {
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--card-border);
            padding: 2.5rem;
            border-radius: 24px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: inline-block;
            animation: pulse 2s infinite ease-in-out;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        h1 {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            font-size: 0.875rem;
            color: var(--text-muted);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        input[type="password"] {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--card-border);
            border-radius: 12px;
            color: #fff;
            font-size: 1rem;
            transition: all 0.3s;
            outline: none;
        }

        input[type="password"]:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25);
            background: rgba(255, 255, 255, 0.08);
        }

        .btn {
            width: 100%;
            padding: 0.75rem;
            background: var(--primary);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .btn:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
        }

        .btn:active {
            transform: translateY(0);
        }

        .error-message {
            color: var(--error);
            font-size: 0.875rem;
            margin-top: 1rem;
            text-align: center;
            display: none;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="header">
            <span class="logo">🔒</span>
            <h1>Browser MCP</h1>
            <p class="subtitle">Enter the password to authorize your session</p>
        </div>
        <form id="login-form">
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" required placeholder="••••••••" autocomplete="current-password">
            </div>
            <button type="submit" class="btn">Authorize</button>
            <div id="error-msg" class="error-message">Invalid password. Please try again.</div>
        </form>
    </div>

    <script>
        const form = document.getElementById('login-form');
        const errorMsg = document.getElementById('error-msg');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(window.location.pathname + window.location.search, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.redirect) {
                        window.location.href = result.redirect;
                    } else {
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirectUrl = urlParams.get('redirect') || '/';
                        window.location.href = redirectUrl;
                    }
                } else {
                    errorMsg.style.display = 'block';
                }
            } catch (err) {
                errorMsg.textContent = 'Connection error. Please try again.';
                errorMsg.style.display = 'block';
            }
        });
    </script>
</body>
</html>
`;

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  return `${protocol}://${host}`;
}

function isPublicPath(pathname) {
  return (
    pathname === '/login' ||
    pathname === '/oauth/authorize' ||
    pathname === '/oauth/token' ||
    pathname === '/oauth/register' ||
    pathname.includes('oauth-protected-resource') ||
    pathname.includes('oauth-authorization-server') ||
    pathname.includes('manifest.json') ||
    pathname.includes('openid-configuration')
  );
}

function isAuthorized(req) {
  // 1. Check Bearer Token
  const authHeader = req.headers['authorization'];
  if (authHeader === `Bearer ${PASSWORD}`) {
    return true;
  }

  // 2. Check query parameter token
  try {
    const parsedUrl = new URL(req.url || '', 'http://localhost');
    if (parsedUrl.searchParams.get('token') === PASSWORD) {
      return true;
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  // 3. Check Cookie
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    if (cookies['mcp_session'] === PASSWORD) {
      return true;
    }
  }

  return false;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '', 'http://localhost');
  const baseUrl = getBaseUrl(req);
  const pathname = parsedUrl.pathname;

  // Handle Public OAuth & Metadata endpoints BEFORE authorization checks
  if (isPublicPath(pathname)) {
    // Handle OPTIONS/CORS for public paths
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      });
      res.end();
      return;
    }

    // A. OAuth Protected Resource Metadata
    if (req.method === 'GET' && pathname.includes('oauth-protected-resource')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        resource: baseUrl,
        authorization_servers: [baseUrl],
        scopes_supported: ['read', 'write']
      }));
      return;
    }

    // B. OAuth Authorization Server Metadata (RFC 8414)
    if (req.method === 'GET' && pathname.includes('oauth-authorization-server')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/oauth/token`,
        registration_endpoint: `${baseUrl}/oauth/register`,
        scopes_supported: ['read', 'write'],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        token_endpoint_auth_methods_supported: ['none'],
        code_challenge_methods_supported: ['S256']
      }));
      return;
    }

    // C. OpenID Configuration
    if (req.method === 'GET' && pathname.includes('openid-configuration')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/oauth/token`,
        userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
        jwks_uri: `${baseUrl}/oauth/certs`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256']
      }));
      return;
    }

    // D. Manifest Endpoint
    if (req.method === 'GET' && pathname.includes('manifest.json')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        manifestVersion: '0.1.0',
        name: 'any-mcp-tunnel',
        version: '1.0.0'
      }));
      return;
    }

    // E. Dynamic Client Registration (POST /oauth/register)
    if (req.method === 'POST' && pathname === '/oauth/register') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const metadata = JSON.parse(body);
          const clientId = 'client_' + Math.random().toString(36).substring(2, 15);
          const clientSecret = 'secret_' + Math.random().toString(36).substring(2, 15);
          
          res.writeHead(201, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            client_id_issued_at: Math.floor(Date.now() / 1000),
            client_secret_expires_at: 0,
            ...metadata,
            token_endpoint_auth_method: metadata.token_endpoint_auth_method || 'none'
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'invalid_client_metadata' }));
        }
      });
      return;
    }

    // F. OAuth Authorize (GET: Serve form)
    if (req.method === 'GET' && pathname === '/oauth/authorize') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(LOGIN_PAGE_HTML);
      return;
    }

    // G. OAuth Authorize (POST: Validate & redirect)
    if (req.method === 'POST' && pathname === '/oauth/authorize') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.password === PASSWORD) {
            const redirectUri = parsedUrl.searchParams.get('redirect_uri');
            const state = parsedUrl.searchParams.get('state');
            
            if (!redirectUri) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing redirect_uri parameter' }));
              return;
            }

            const code = 'mock_code_' + Math.random().toString(36).substring(2, 15);
            oauthCodes.set(code, { redirectUri, createdAt: Date.now() });

            const targetUrl = new URL(redirectUri);
            targetUrl.searchParams.set('code', code);
            if (state) {
              targetUrl.searchParams.set('state', state);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, redirect: targetUrl.toString() }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid password' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      return;
    }

    // H. OAuth Token (POST: Exchange code for password bearer)
    if (req.method === 'POST' && pathname === '/oauth/token') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const params = Object.fromEntries(new URLSearchParams(body));
          const code = params.code;

          if (!code || !oauthCodes.has(code)) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' }));
            return;
          }

          oauthCodes.delete(code);

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            access_token: PASSWORD,
            token_type: 'Bearer',
            expires_in: 86400
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'invalid_request', error_description: 'Unable to parse request body' }));
        }
      });
      return;
    }

    // I. Standard Login GET
    if (req.method === 'GET' && pathname === '/login') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(LOGIN_PAGE_HTML);
      return;
    }

    // J. Standard Login POST
    if (req.method === 'POST' && pathname === '/login') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.password === PASSWORD) {
            res.writeHead(200, {
              'Set-Cookie': `mcp_session=${PASSWORD}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid password' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      return;
    }
  }

  // Handle Options preflight (for protected paths)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    });
    res.end();
    return;
  }

  // Check Authorization for protected routes (/sse, /message)
  if (!isAuthorized(req)) {
    console.log(`[Proxy] Unauthorized access attempt: ${req.method} ${req.url}`);
    
    // For standard web browser page requests, redirect to login
    const acceptHeader = req.headers['accept'] || '';
    if (req.method === 'GET' && acceptHeader.includes('text/html')) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(req.url || '/')}`;
      res.writeHead(302, { 'Location': redirectUrl });
      res.end();
      return;
    }

    res.writeHead(401, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'WWW-Authenticate': 'Bearer'
    });
    res.end('Unauthorized - Please authorize via the web portal or provide the correct Bearer token.');
    return;
  }

  // === DUAL TRANSPORT ROUTING ===

  // Mode A: Pure HTTP Proxy (Streamable HTTP mode)
  if (TARGET_PORT) {
    const options = {
      hostname: '127.0.0.1',
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${TARGET_PORT}`
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      const headers = {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(proxyRes.statusCode || 200, headers);
      proxyRes.pipe(res);
    });

    req.pipe(proxyReq);

    proxyReq.on('error', (err) => {
      console.error(`[Proxy] Target request error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        res.end(`Bad Gateway: Failed to connect to the local MCP server.`);
      }
    });
    return;
  }

  // Mode B: Custom SSE Gateway (SSE mode)
  
  // 1. SSE Connection Handler
  if (req.method === 'GET' && pathname === '/sse') {
    console.log(`[Proxy] New SSE client connection request`);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    const client = { res, sessionId };
    sseClients.add(client);

    console.log(`[Proxy] SSE Client registered: ${sessionId}`);

    // Immediately send the endpoint mapping event
    res.write(`event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`);

    req.on('close', () => {
      sseClients.delete(client);
      console.log(`[Proxy] SSE Client disconnected: ${sessionId}`);
    });
    return;
  }

  // 2. Client-to-Server Message POST Handler
  if (req.method === 'POST' && pathname === '/message') {
    const sessionId = parsedUrl.searchParams.get('sessionId');
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Missing sessionId parameter' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log(`[Proxy] Received message for session ${sessionId}: ${body}`);
      try {
        // Forward message to child process stdin
        if (child) {
          child.stdin.write(body + '\n');
        }
        
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error(`[Proxy] Failed to write to child stdin: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
    return;
  }

  // Fallback for any unhandled routes
  res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Auth proxy listening on port ${PORT} (Mode: ${TARGET_PORT ? 'HTTP Proxy to ' + TARGET_PORT : 'Custom SSE Gateway'})`);
});
