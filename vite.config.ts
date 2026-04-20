import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
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
