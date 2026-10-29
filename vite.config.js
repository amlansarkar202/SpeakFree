import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Local development middleware for /api/tts
function ttsDevPlugin() {
  return {
    name: 'tts-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost:5173');
          const text = url.searchParams.get('text');
          const lang = url.searchParams.get('lang') || 'bn';

          if (!text) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing text' }));
          }

          const cleanLang = lang.startsWith('bn') ? 'bn' : 'en';
          const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${cleanLang}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (!response.ok) {
            res.statusCode = response.status;
            return res.end('TTS error');
          }

          const arrayBuffer = await response.arrayBuffer();
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(Buffer.from(arrayBuffer));
        } catch (err) {
          res.statusCode = 500;
          res.end(err.message);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ttsDevPlugin(),
  ],
});
