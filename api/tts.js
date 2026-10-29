export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const text = url.searchParams.get('text') || req.query?.text;
    const lang = url.searchParams.get('lang') || req.query?.lang || 'bn';

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const cleanLang = lang.startsWith('bn') ? 'bn' : 'en';
    const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${cleanLang}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'TTS service error' });
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Serverless TTS error:', error);
    return res.status(500).json({ error: error.message || 'TTS failed' });
  }
}
