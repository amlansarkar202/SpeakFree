// SpeakFree Universal Bilingual Female AI Tutor Audio Engine
// Delivers the warm, natural, human female Bengali voice (Google Bengali)
// and clear female English tutor voice across all features:
// Lessons, Nova AI Chat, Daily Practice, Pronunciation Listeners, and Celebrations.

// In-memory audio cache for instant 0ms responses on repeated phrases
const memoryAudioCache = new Map();

/**
 * Intelligent Bilingual Text Segmenter
 * Automatically partitions mixed Bengali & English sentences into natural speech chunks
 * so Bengali phrases use the authentic female Bengali voice (tl=bn)
 * and English phrases use the native female English voice (tl=en).
 */
export function segmentBilingualText(text, requestedLang) {
  if (!text || typeof text !== 'string') return [];

  // 1. Clean markdown, emojis, HTML tags, asterisks, brackets, and extra spaces
  const clean = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_~`#[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return [];

  // 2. Split on quotes and sentence boundaries (. ! ? । \n)
  const rawSegments = clean.split(/(["'].*?["']|(?<=[.!?।\n])\s+)/);

  const rawChunks = [];
  for (const part of rawSegments) {
    if (!part) continue;
    const isQuoted = /^["'].*["']$/.test(part.trim());
    const trimmed = part.replace(/^["'\s]+|["'\s]+$/g, '').trim();
    if (!trimmed) continue;
    // Skip chunks that contain solely punctuation
    if (/^[.,!?;:—\-~`'"\s]+$/.test(trimmed)) continue;
    rawChunks.push({ text: trimmed, isQuoted });
  }

  // 3. Subdivide any mixed chunk that wasn't already split by quotes/clauses
  const intermediate = [];
  for (const chunk of rawChunks) {
    const hasBn = /[\u0980-\u09FF]/.test(chunk.text);
    const hasEn = /[a-zA-Z]/.test(chunk.text);

    if (chunk.isQuoted) {
      intermediate.push(chunk);
      continue;
    }

    if (hasBn && hasEn) {
      // Split on colon, semicolon, dash, or contiguous 2+ English words boundary
      const subParts = chunk.text.split(/(?<=[;:\n—])\s+|(?=[\u0980-\u09FF])(?<=[a-zA-Z]+\s+[a-zA-Z]+[\s.,!?;:—]+)|(?=[a-zA-Z]+\s+[a-zA-Z]+)(?<=[\u0980-\u09FF]+[\s.,!?;:—]+)/);
      for (const sp of subParts) {
        const tr = sp.trim();
        if (tr && !/^[.,!?;:—\-~`'"\s]+$/.test(tr)) {
          intermediate.push({ text: tr, isQuoted: false });
        }
      }
    } else {
      intermediate.push(chunk);
    }
  }

  // 4. Assign language and consolidate adjacent chunks of the same language
  // Bengali Unicode range [\u0980-\u09FF] strictly gets 'bn'
  // Latin / English text strictly gets 'en'
  const consolidated = [];
  for (const piece of intermediate) {
    const hasBn = /[\u0980-\u09FF]/.test(piece.text);
    let lang;
    if (requestedLang) {
      lang = requestedLang.startsWith('bn') ? 'bn' : 'en';
    } else {
      lang = hasBn ? 'bn' : 'en';
    }

    if (consolidated.length > 0 && consolidated[consolidated.length - 1].lang === lang) {
      const prev = consolidated[consolidated.length - 1];
      if ((prev.text + ' ' + piece.text).length <= 180) {
        prev.text = prev.text + ' ' + piece.text;
        continue;
      }
    }

    // Split if single chunk exceeds 180 characters (Google TTS limit is 200 chars)
    if (piece.text.length <= 180) {
      consolidated.push({ text: piece.text, lang });
    } else {
      const subParts = piece.text.match(/.{1,180}(\s|$)/g) || [piece.text];
      for (const sp of subParts) {
        const sptr = sp.trim();
        if (sptr) consolidated.push({ text: sptr, lang });
      }
    }
  }

  return consolidated;
}

/**
 * Fetch a single audio segment from Google Translate TTS with female voice
 */
async function fetchTtsChunk(text, lang) {
  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
    },
  });

  if (!res.ok) {
    throw new Error(`Google TTS upstream status ${res.status}`);
  }

  const arr = await res.arrayBuffer();
  if (!arr || arr.byteLength === 0) {
    throw new Error('Empty audio received from upstream');
  }

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

    const cleanInput = text.trim();
    if (!cleanInput) {
      return res.status(400).json({ error: 'Empty text parameter' });
    }

    // 1. Check in-memory cache for instant 0ms retrieval
    const cacheKey = `${requestedLang || 'auto'}:${cleanInput}`;
    if (memoryAudioCache.has(cacheKey)) {
      const cached = memoryAudioCache.get(cacheKey);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', cached.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(cached);
    }

    // 2. Break down into bilingual chunks (Bengali chunks -> bn, English chunks -> en)
    const chunks = segmentBilingualText(cleanInput, requestedLang);
    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ error: 'No pronounceable chunks after parsing' });
    }

    // Limit to 10 chunks per speech request to prevent latency degradation
    const chunksToProcess = chunks.slice(0, 10);

    // 3. Parallel fetch all audio chunks with preserved sequence
    const audioBuffers = await Promise.all(
      chunksToProcess.map((chunk) => fetchTtsChunk(chunk.text, chunk.lang))
    );

    if (audioBuffers.length === 0) {
      return res.status(502).json({ error: 'Audio synthesis failed' });
    }

    // 4. Concatenate MPEG frames into one smooth continuous audio stream
    const combinedAudio = Buffer.concat(audioBuffers);

    // 5. Store in memory cache (cap at 150 items)
    if (memoryAudioCache.size > 150) {
      const firstKey = memoryAudioCache.keys().next().value;
      memoryAudioCache.delete(firstKey);
    }
    memoryAudioCache.set(cacheKey, combinedAudio);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', combinedAudio.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(combinedAudio);
  } catch (error) {
    console.error('Serverless TTS error:', error);
    return res.status(500).json({ error: error.message || 'TTS generation error' });
  }
}
