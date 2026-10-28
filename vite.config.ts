import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { registryWritePlugin } from './vite.registry-write';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    react(),
    {
      name: 'api-chat',
      configureServer(server) {
        server.middlewares.use('/api/chat', async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks).toString();
              const apiKey = env.ANTHROPIC_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not set in .env.local' } }));
                return;
              }
              const upstream = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                  'content-type': 'application/json',
                },
                body,
              });
              const data = await upstream.json();
              res.statusCode = upstream.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (e: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              const msg = e instanceof Error ? e.message : String(e);
              res.end(JSON.stringify({ error: { message: msg } }));
            }
          });
        });
      },
    },
    registryWritePlugin(),
  ],
  build: {
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tokens': path.resolve(__dirname, './src/tokens'),
      '@components': path.resolve(__dirname, './src/components'),
      '@spotter': path.resolve(__dirname, './src/spotter'),
    },
  },
  };
});
