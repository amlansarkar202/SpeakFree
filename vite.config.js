import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Local development middleware for /api/tts matching production serverless behavior
function ttsDevPlugin() {
  return {
    name: 'tts-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost:5173');
          const text = url.searchParams.get('text');
          const requestedLang = url.searchParams.get('lang');

          if (!text) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing text parameter' }));
          }

          const cleanText = text
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
            .replace(/[*_~`#[\]]/g, ' ')
            .trim();

          if (!cleanText) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Empty text' }));
          }

          const rawChunks = cleanText.split(/(?<=[.!?।\n])\s+/);
          const chunks = [];

          for (const chunk of rawChunks) {
            const trimmed = chunk.trim();
            if (!trimmed) continue;
            if (trimmed.length <= 160) {
              chunks.push(trimmed);
            } else {
              const parts = trimmed.split(/(?<=[,;])\s+/);
              let curr = '';
              for (const p of parts) {
                if ((curr + ' ' + p).length <= 160) {
                  curr = curr ? curr + ' ' + p : p;
                } else {
                  if (curr) chunks.push(curr);
                  curr = p;
                }
              }
              if (curr) chunks.push(curr);
            }
          }

          const finalChunks = chunks.length > 0 ? chunks : [cleanText.slice(0, 160)];
          const audioBuffers = [];

          for (const ch of finalChunks.slice(0, 6)) {
            const hasBengali = /[\u0980-\u09FF]/.test(ch);
            const chunkLang = requestedLang
              ? (requestedLang.startsWith('bn') ? 'bn' : 'en')
              : (hasBengali ? 'bn' : 'en');

            const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${chunkLang}&client=tw-ob&q=${encodeURIComponent(ch)}`;

            try {
              const upstream = await fetch(targetUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
              });

              if (upstream.ok) {
                const arr = await upstream.arrayBuffer();
                if (arr.byteLength > 0) {
                  audioBuffers.push(Buffer.from(arr));
                }
              }
            } catch (err) {
              console.error('Dev TTS chunk error:', err);
            }
          }

          if (audioBuffers.length === 0) {
            res.statusCode = 502;
            return res.end('Upstream audio error');
          }

          const combinedAudio = Buffer.concat(audioBuffers);
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', combinedAudio.length);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(combinedAudio);
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
