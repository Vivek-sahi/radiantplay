import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function feedbackPlugin(): Plugin {
  return {
    name: 'feedback-overlay',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/lib/feedback.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(fs.readFileSync(path.resolve(__dirname, 'lib/feedback.js'), 'utf-8'));
      });
      server.middlewares.use('/lib/feedback.css', (_req, res) => {
        res.setHeader('Content-Type', 'text/css');
        res.end(fs.readFileSync(path.resolve(__dirname, 'lib/feedback.css'), 'utf-8'));
      });
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace('</body>',
          `  <link rel="stylesheet" href="/lib/feedback.css">\n` +
          `  <script type="module" src="/lib/feedback.js"></script>\n` +
          `</body>`
        );
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), feedbackPlugin()],
    build: {
      sourcemap: false,
    },
    server: {
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              // Inject credentials at proxy level — keeps key off the client bundle
              if (env.VITE_ANTHROPIC_API_KEY) {
                proxyReq.setHeader('x-api-key', env.VITE_ANTHROPIC_API_KEY);
              }
              proxyReq.setHeader('anthropic-version', '2023-06-01');
            });
            proxy.on('error', (err) => {
              console.error('[proxy] Anthropic error:', err.message);
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@tokens': path.resolve(__dirname, './src/tokens'),
        '@components': path.resolve(__dirname, './src/components'),
      },
    },
  };
});
