const COOKIE_NAME = 'rp_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode('rp_salt_' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function passwordPage(error = false, redirect = '/'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Radiant Play</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f7;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    }
    h1 { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px; }
    p { font-size: 14px; color: #666; margin-bottom: 24px; line-height: 1.5; }
    label { display: block; font-size: 13px; font-weight: 500; color: #333; margin-bottom: 6px; }
    input[type="password"] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid ${error ? '#e53935' : '#ddd'};
      border-radius: 8px;
      font-size: 15px;
      outline: none;
    }
    input[type="password"]:focus { border-color: #2770EF; box-shadow: 0 0 0 3px rgba(39,112,239,0.15); }
    .error { font-size: 13px; color: #e53935; margin-top: 6px; }
    button {
      width: 100%;
      margin-top: 16px;
      padding: 11px;
      background: #2770EF;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover { background: #1a5fd4; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Radiant Play</h1>
    <p>Internal design prototype environment. Enter the access password to continue.</p>
    <form method="POST" action="/_auth">
      <input type="hidden" name="redirect" value="${redirect}" />
      <label for="pw">Password</label>
      <input type="password" id="pw" name="password" placeholder="Enter password" autofocus />
      ${error ? '<div class="error">Incorrect password. Try again.</div>' : ''}
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;
}

export const config = {
  matcher: ['/((?!landing\\.html|_next/|favicon|.*\\.ico|.*\\.png|.*\\.svg|.*\\.woff2|.*\\.css|.*\\.js).*)'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const sitePassword = process.env.SITE_PASSWORD || '';
  const url = new URL(request.url);

  // Password gate — production only
  if (isProduction && sitePassword) {
    // Handle auth form submission
    if (request.method === 'POST' && url.pathname === '/_auth') {
      const body = await request.text();
      const params = new URLSearchParams(body);
      const submitted = params.get('password') || '';
      const redirect = params.get('redirect') || '/';

      if (submitted === sitePassword) {
        const token = await hashPassword(sitePassword);
        return new Response(null, {
          status: 302,
          headers: {
            Location: redirect,
            'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax; Secure`,
          },
        });
      }

      return new Response(passwordPage(true, redirect), {
        status: 401,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Check auth cookie on all other requests
    const cookieHeader = request.headers.get('cookie') || '';
    const authCookie = getCookieValue(cookieHeader, COOKIE_NAME);
    const expectedToken = await hashPassword(sitePassword);

    if (authCookie !== expectedToken) {
      return new Response(passwordPage(false, url.pathname + url.search), {
        status: 401,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }

  // Existing: PUBLIC_MODE landing page redirect
  if (process.env.PUBLIC_MODE !== 'true') {
    return;
  }

  url.pathname = '/landing.html';
  return Response.redirect(url.toString(), 302);
}
