import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import authHandler from './api/auth.js';

import ttsHandler from './api/tts.js';

// Local development middleware for /api/tts matching production serverless behavior
function ttsDevPlugin() {
  return {
    name: 'tts-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        const mockRes = {
          statusCode: 200,
          status(code) {
            res.statusCode = code;
            return this;
          },
          setHeader(k, v) {
            res.setHeader(k, v);
            return this;
          },
          send(data) {
            res.end(data);
          },
          json(data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          },
          end(data) {
            res.end(data);
          },
        };
        try {
          await ttsHandler(req, mockRes);
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

// Local development middleware for /api/auth
function authDevPlugin() {
  return {
    name: 'auth-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/auth', async (req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch {
            req.body = {};
          }
          const mockRes = {
            statusCode: 200,
            status(code) {
              res.statusCode = code;
              return this;
            },
            setHeader(k, v) {
              res.setHeader(k, v);
              return this;
            },
            json(data) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            end(data) {
              res.end(data);
            },
          };
          try {
            await authHandler(req, mockRes);
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ttsDevPlugin(),
    authDevPlugin(),
  ],
});
