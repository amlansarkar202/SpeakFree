// SpeakFree High-Fidelity Serverless Bilingual Audio Engine
// Converts text with mixed Bengali and English into a single continuous MP3 stream

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const text = url.searchParams.get('text') || req.query?.text;
    const requestedLang = url.searchParams.get('lang') || req.query?.lang;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    // 1. Clean emojis and markdown formatting
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_~`#[\]]/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'Empty text after cleaning' });
    }

    // 2. Intelligent bilingual chunking (Bengali parts in Bengali, English parts in English)
    const rawSentences = cleanText.split(/(?<=[.!?।\n])\s+/);
    const finalChunks = [];

    for (const sent of rawSentences) {
      const trimmed = sent.trim();
      if (!trimmed) continue;
      const hasBn = /[\u0980-\u09FF]/.test(trimmed);
      const hasEn = /[a-zA-Z]/.test(trimmed);

      if (hasBn && hasEn) {
        // Subdivide mixed sentence by quotes or clauses
        const sub = trimmed.split(/(["'].*?["'])/);
        for (const s of sub) {
          const str = s.trim().replace(/["']/g, '');
          if (str) finalChunks.push(str.slice(0, 160));
        }
      } else {
        finalChunks.push(trimmed.slice(0, 160));
      }
    }

    const chunksToProcess = finalChunks.length > 0 ? finalChunks.slice(0, 8) : [cleanText.slice(0, 160)];

    // 3. Fetch each chunk with appropriate voice (Bengali or English)
    const audioBuffers = [];
    for (const ch of chunksToProcess) {
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
      } catch (fetchErr) {
        console.error('TTS chunk fetch failed:', fetchErr);
      }
    }

    if (audioBuffers.length === 0) {
      return res.status(502).json({ error: 'TTS upstream returned no audio' });
    }

    // Concatenate MPEG frames into one smooth stream
    const combinedAudio = Buffer.concat(audioBuffers);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', combinedAudio.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(combinedAudio);
  } catch (error) {
    console.error('Serverless TTS error:', error);
    return res.status(500).json({ error: error.message || 'TTS failed' });
  }
}
