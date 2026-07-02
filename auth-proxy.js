import http from 'http';
import { URL } from 'url';

const PASSWORD = process.env.MCP_PASSWORD;
const PORT = parseInt(process.env.PORT || '3000', 10);
const TARGET_PORT = parseInt(process.env.TARGET_PORT || '3001', 10);

if (!PASSWORD) {
  console.error("Error: MCP_PASSWORD environment variable is required");
  process.exit(1);
}

// Inline Login Page HTML/CSS
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
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectUrl = urlParams.get('redirect') || '/';
                    window.location.href = redirectUrl;
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
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '', 'http://localhost');

  // Handle Login GET Request
  if (req.method === 'GET' && parsedUrl.pathname === '/login') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(LOGIN_PAGE_HTML);
    return;
  }

  // Handle Login POST Request
  if (req.method === 'POST' && parsedUrl.pathname === '/login') {
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

  // Check Authorization for other paths
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

    // For APIs (like SSE endpoints / message posts) return 401 directly
    res.writeHead(401, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    });
    res.end('Unauthorized - Please authorize via the web portal or provide the correct Bearer token.');
    return;
  }

  // Forward the request to the local supergateway
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
    // Add CORS headers to the proxied response to ensure AI clients can connect
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
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Auth proxy listening on port ${PORT}, forwarding to internal port ${TARGET_PORT}`);
});
