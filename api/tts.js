// SpeakFree Ultra-High-Fidelity Neural Audio Engine
// Uses Microsoft Azure Neural Voices (bn-IN-TanishaaNeural & en-US-JennyNeural)
// for lifelike, warm, expressive female spoken English & Bengali tutoring

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// In-memory audio cache for instant 0ms responses on repeated phrases
const memoryAudioCache = new Map();

async function synthesizeNeural(text, voice) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Neural synthesis timeout'));
    }, 5500);

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

// Fallback to Google TTS in case of upstream network disruption
async function synthesizeFallback(text, lang) {
  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error('Fallback upstream error');
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers?.host || 'localhost'}`);
    const text = url.searchParams.get('text') || req.query?.text;
    const requestedLang = url.searchParams.get('lang') || req.query?.lang;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    // Clean emojis, asterisks, brackets, and markdown artifacts
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_~`#[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'Empty text after cleaning' });
    }

    // Check memory cache
    const cacheKey = `${requestedLang || 'auto'}:${cleanText}`;
    if (memoryAudioCache.has(cacheKey)) {
      const cached = memoryAudioCache.get(cacheKey);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', cached.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(cached);
    }

    // Determine voice:
    // - Bengali / Bilingual: Microsoft Tanishaa (Expressive Indian West Bengal female neural voice)
    // - Pure English: Microsoft Jenny (Warm, friendly native female teacher voice)
    const hasBengali = /[\u0980-\u09FF]/.test(cleanText);
    const voice = requestedLang === 'en'
      ? 'en-US-JennyNeural'
      : requestedLang === 'bn'
        ? 'bn-IN-TanishaaNeural'
        : (hasBengali ? 'bn-IN-TanishaaNeural' : 'en-US-JennyNeural');

    let audioBuffer = null;

    // 1. Primary: High-definition Azure Neural Voice
    try {
      audioBuffer = await synthesizeNeural(cleanText.slice(0, 480), voice);
    } catch (neuralErr) {
      console.warn('Neural TTS failed, using fallback:', neuralErr.message);
    }

    // 2. Secondary fallback
    if (!audioBuffer || audioBuffer.length === 0) {
      const fallbackLang = hasBengali ? 'bn' : 'en';
      audioBuffer = await synthesizeFallback(cleanText, fallbackLang);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(502).json({ error: 'Audio synthesis failed' });
    }

    // Store in cache (keep up to 100 recent items)
    if (memoryAudioCache.size > 100) {
      const firstKey = memoryAudioCache.keys().next().value;
      memoryAudioCache.delete(firstKey);
    }
    memoryAudioCache.set(cacheKey, audioBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('TTS API error:', error);
    return res.status(500).json({ error: error.message || 'TTS generation error' });
  }
}
