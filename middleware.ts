declare const process: { env: Record<string, string | undefined> };

const COOKIE_NAME = 'rp_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

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
    .eyes {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .eye-wrap {
      position: relative;
      width: 52px;
      padding-top: 10px;
    }
    .lashes {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 3px;
      width: 36px;
      height: 10px;
    }
    .lash {
      width: 1.5px;
      background: #555;
      border-radius: 1px;
      transform-origin: bottom center;
    }
    .lash:nth-child(1) { height: 5px; transform: rotate(-22deg); }
    .lash:nth-child(2) { height: 7px; transform: rotate(-10deg); }
    .lash:nth-child(3) { height: 8px; transform: rotate(0deg); }
    .lash:nth-child(4) { height: 7px; transform: rotate(10deg); }
    .lash:nth-child(5) { height: 5px; transform: rotate(22deg); }
    .eye {
      width: 52px;
      height: 52px;
      background: white;
      border: 2.5px solid #4a4a55;
      border-radius: 50%;
      position: relative;
      overflow: hidden;
    }
    .pupil {
      width: 22px;
      height: 22px;
      background: #4a4a55;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: transform 0.05s linear;
    }
    .pupil::after {
      content: '';
      width: 7px;
      height: 7px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 4px;
      left: 4px;
    }
    .eyelid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 0%;
      background: white;
      border-radius: 0 0 50% 50%;
      transition: height 0.15s ease;
    }
    h1 { font-size: 20px; font-weight: 600; color: #2a2a35; margin-bottom: 8px; }
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
    <div class="eyes">
      <div class="eye-wrap">
        <div class="lashes">
          <div class="lash"></div><div class="lash"></div><div class="lash"></div><div class="lash"></div><div class="lash"></div>
        </div>
        <div class="eye" id="eye-left">
          <div class="pupil" id="pupil-left"></div>
          <div class="eyelid" id="lid-left"></div>
        </div>
      </div>
      <div class="eye-wrap">
        <div class="lashes">
          <div class="lash"></div><div class="lash"></div><div class="lash"></div><div class="lash"></div><div class="lash"></div>
        </div>
        <div class="eye" id="eye-right">
          <div class="pupil" id="pupil-right"></div>
          <div class="eyelid" id="lid-right"></div>
        </div>
      </div>
    </div>
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
  <script>
    const pupils = [
      { pupil: document.getElementById('pupil-left'), eye: document.getElementById('eye-left') },
      { pupil: document.getElementById('pupil-right'), eye: document.getElementById('eye-right') },
    ];
    const lids = [document.getElementById('lid-left'), document.getElementById('lid-right')];
    const pw = document.getElementById('pw');

    document.addEventListener('mousemove', (e) => {
      pupils.forEach(({ pupil, eye }) => {
        const rect = eye.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const dist = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy), 10);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        pupil.style.transform = 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px))';
      });
    });

    pw.addEventListener('input', () => {
      const closed = pw.value.length > 0;
      lids.forEach(lid => lid.style.height = closed ? '100%' : '0%');
    });
  </script>
</body>
</html>`;
}

export const config = {
  matcher: ['/((?!landing\\.html|_next/|favicon|.*\\.ico|.*\\.png|.*\\.svg|.*\\.woff2|.*\\.css|.*\\.js).*)'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const vercelEnv = process.env.VERCEL_ENV;
  const gitRef = process.env.VERCEL_GIT_COMMIT_REF || '';
  // Staging branch is public; production + other preview branches stay gated.
  const isDeployed =
    vercelEnv === 'production' ||
    (vercelEnv === 'preview' && gitRef !== 'staging');
  const sitePassword = process.env.SITE_PASSWORD || '';
  const url = new URL(request.url);

  // Password gate — all deployed environments (production + every preview, including staging)
  if (isDeployed && sitePassword) {
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
