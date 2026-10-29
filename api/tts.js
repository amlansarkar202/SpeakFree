// SpeakFree Universal Neural AI Tutor Voice Engine
// Exclusively uses the authentic Bengali female voice (bn-IN-TanishaaNeural)
// for all features: Lessons, Nova AI Chat, Home Greetings, and Pronunciation.
// Completely eliminates the old monotone Google Translate bot (tl=bn) and robotic browser voices.

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// In-memory cache for instant 0ms responses on repeated phrases
const memoryAudioCache = new Map();

async function synthesizeTanishaa(text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('bn-IN-TanishaaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Tanishaa synthesis timeout'));
    }, 12000);

    try {
      const { audioStream } = tts.toStream(text);
      const chunks = [];

      audioStream.on('data', (c) => chunks.push(c));
      audioStream.on('end', () => {
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks));
      });
      audioStream.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  });
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers?.host || 'localhost'}`);
    const text = url.searchParams.get('text') || req.query?.text;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    // Clean emojis, asterisks, brackets, and markdown artifacts
    const cleanText = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_~`#[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'Empty text after cleaning' });
    }

    // Check memory cache
    const cacheKey = cleanText;
    if (memoryAudioCache.has(cacheKey)) {
      const cached = memoryAudioCache.get(cacheKey);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', cached.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(cached);
    }

    // Synthesize exclusively using the authentic female voice (bn-IN-TanishaaNeural)
    const audioBuffer = await synthesizeTanishaa(cleanText.slice(0, 800));

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(502).json({ error: 'Audio synthesis failed' });
    }

    // Store in cache (keep up to 150 items)
    if (memoryAudioCache.size > 150) {
      const firstKey = memoryAudioCache.keys().next().value;
      memoryAudioCache.delete(firstKey);
    }
    memoryAudioCache.set(cacheKey, audioBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('Tanishaa TTS error:', error);
    return res.status(500).json({ error: error.message || 'TTS generation error' });
  }
}
