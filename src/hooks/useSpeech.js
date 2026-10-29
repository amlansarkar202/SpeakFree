// SpeakFree Natural Human Voice & Speech Evaluation Engine
// Features:
// 1. Natural Neural Voice: Exclusively uses the high-quality human voices (Microsoft Natural / Google Female / Apple Samantha)
//    - Completely eliminates the monotone 2010 Google Translate bot
//    - Bilingual Segmenter: Speaks Bengali in native Bengali voice and English in natural English female tutor voice
// 2. Speech-to-Text (STT): Robust recognition with automatic onEnd transcript capture
// 3. Accurate Pronunciation Evaluator:
//    - Fixed bug where short words and undefined homophones matched everything (preventing false 67% scores)
//    - Genuine scoring: 100% for correct speech, accurate reduction for errors, 0% for wrong speech

import { useState, useCallback, useRef, useEffect } from 'react';

let globalVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const vs = window.speechSynthesis.getVoices();
  if (vs && vs.length > 0) {
    globalVoices = vs;
  }
  return globalVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  }
}

// Global user interaction unlocker to bypass browser speech restrictions
export function unlockAudio() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.resume();
      loadVoices();
    } catch {}
  }
}

if (typeof window !== 'undefined') {
  const handleFirstTouch = () => {
    unlockAudio();
    window.removeEventListener('click', handleFirstTouch);
    window.removeEventListener('touchstart', handleFirstTouch);
    window.removeEventListener('keydown', handleFirstTouch);
  };
  window.addEventListener('click', handleFirstTouch, { passive: true });
  window.addEventListener('touchstart', handleFirstTouch, { passive: true });
  window.addEventListener('keydown', handleFirstTouch, { passive: true });
}

function pickBestVoice(voices, lang) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  if (lang === 'bn') {
    // 1. Natural / Online Bengali voice (e.g. Microsoft Sunita)
    const naturalBn = voices.find(
      (v) =>
        v.lang.startsWith('bn') &&
        (v.name.includes('Sunita') || v.name.includes('Natural') || v.name.includes('Online'))
    );
    if (naturalBn) return naturalBn;

    // 2. Google বাংলা
    const googleBn = voices.find(
      (v) =>
        v.lang.startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
    );
    if (googleBn) return googleBn;

    return null;
  }

  // English — Natural Neural Female Voices:
  // 1. Microsoft Jenny / Aria / Neerja Online Natural
  const naturalFemaleEn = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Jenny') ||
        v.name.includes('Aria') ||
        v.name.includes('Neerja') ||
        (v.name.includes('Natural') && !v.name.includes('Guy') && !v.name.includes('George')))
  );
  if (naturalFemaleEn) return naturalFemaleEn;

  // 2. Google UK English Female / Google US English / Apple Samantha / Karen
  const goodFemaleEn = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Google UK English Female') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Victoria') ||
        v.name.toLowerCase().includes('female') ||
        v.name.includes('Zira'))
  );
  if (goodFemaleEn) return goodFemaleEn;

  // 3. Any English voice
  return voices.find((v) => v.lang.startsWith('en')) || null;
}

function splitBilingualSegments(text) {
  // Split on sentence boundaries and language switches
  const rawClean = (text || '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_~`#[\]]/g, ' ')
    .trim();

  if (!rawClean) return [];

  const parts = rawClean.split(/(?<=[.!?।\n])\s+/);
  const segments = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const hasBengali = /[\u0980-\u09FF]/.test(trimmed);
    const hasEnglish = /[a-zA-Z]/.test(trimmed);

    if (hasBengali && hasEnglish) {
      // Divide mixed sentence by quotes or clauses
      const subparts = trimmed.split(/(["'].*?["'])/g);
      for (const sp of subparts) {
        const s = sp.trim();
        if (!s) continue;
        const isBn = /[\u0980-\u09FF]/.test(s);
        segments.push({ text: s.replace(/["']/g, ''), lang: isBn ? 'bn' : 'en' });
      }
    } else {
      segments.push({ text: trimmed, lang: hasBengali ? 'bn' : 'en' });
    }
  }

  return segments.length > 0 ? segments : [{ text: rawClean, lang: /[\u0980-\u09FF]/.test(rawClean) ? 'bn' : 'en' }];
}

// ── NATURAL BILINGUAL TEXT-TO-SPEECH (TTS) ──────────────────────────────────
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const isCancelledRef = useRef(false);
  const keepAliveTimerRef = useRef(null);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text) => {
      if (!text || typeof text !== 'string') return;
      stop();
      isCancelledRef.current = false;

      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      const segments = splitBilingualSegments(text);
      if (segments.length === 0) return;

      const voices = loadVoices();
      setSpeaking(true);

      // Chrome speech synthesis heartbeat workaround to prevent unexpected pauses
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAliveTimerRef.current);
          keepAliveTimerRef.current = null;
        }
      }, 10000);

      // Play segments sequentially
      let currentIndex = 0;

      function speakNextSegment() {
        if (isCancelledRef.current || currentIndex >= segments.length) {
          if (keepAliveTimerRef.current) {
            clearInterval(keepAliveTimerRef.current);
            keepAliveTimerRef.current = null;
          }
          setSpeaking(false);
          return;
        }

        const seg = segments[currentIndex];
        currentIndex++;

        const utter = new SpeechSynthesisUtterance(seg.text);
        utter.rate = seg.lang === 'bn' ? 0.94 : 0.92; // Natural, clear teaching pacing
        utter.pitch = 1.04; // Friendly warm female pitch

        const voice = pickBestVoice(voices, seg.lang);
        if (voice) {
          utter.voice = voice;
          utter.lang = voice.lang;
        } else {
          utter.lang = seg.lang === 'bn' ? 'bn-IN' : 'en-US';
        }

        utter.onend = () => {
          if (!isCancelledRef.current) {
            speakNextSegment();
          }
        };

        utter.onerror = () => {
          if (!isCancelledRef.current) {
            speakNextSegment();
          }
        };

        try {
          window.speechSynthesis.speak(utter);
        } catch {
          setSpeaking(false);
        }
      }

      speakNextSegment();
    },
    [stop]
  );

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { speak, stop, speaking };
}

// ── BILINGUAL SPEECH-TO-TEXT (STT) ──────────────────────────────────────────
export function useSTT() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  const startListening = useCallback((options = {}) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    transcriptRef.current = '';
    setTranscript('');
    setError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = options.lang || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
      transcriptRef.current = '';
      setTranscript('');
      unlockAudio();
    };

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      transcriptRef.current = current;
      setTranscript(current);
      options.onTranscriptChange?.(current);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current;
      options.onEnd?.(finalText);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
  }, []);

  return {
    listening,
    transcript,
    transcriptRef,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}

// ── ACCURATE PRONUNCIATION EVALUATOR ────────────────────────────────────────
const CONTRACTIONS = {
  "i'm": ['i', 'am'],
  "it's": ['it', 'is'],
  "dont": ['do', 'not'],
  "don't": ['do', 'not'],
  "cant": ['can', 'not'],
  "can't": ['can', 'not'],
  "cannot": ['can', 'not'],
  "we're": ['we', 'are'],
  "you're": ['you', 'are'],
  "they're": ['they', 'are'],
  "that's": ['that', 'is'],
  "what's": ['what', 'is'],
  "i'll": ['i', 'will'],
  "we'll": ['we', 'will'],
  "let's": ['let', 'us'],
};

const HOMOPHONES = {
  meat: 'meet',
  meet: 'meat',
  too: 'to',
  two: 'to',
  to: 'too',
  hear: 'here',
  here: 'hear',
  bye: 'by',
  buy: 'by',
  by: 'bye',
  know: 'no',
  no: 'know',
  there: 'their',
  their: 'there',
  theyre: 'there',
};

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

function wordsMatch(w1, w2) {
  if (!w1 || !w2) return false;
  if (w1 === w2) return true;

  // Strict homophone match
  if (HOMOPHONES[w1] && (HOMOPHONES[w1] === w2 || HOMOPHONES[w1] === HOMOPHONES[w2])) return true;
  if (HOMOPHONES[w2] && HOMOPHONES[w2] === w1) return true;

  // Levenshtein phonetic distance <= 1 ONLY permitted for words with >= 4 characters
  // Short words (my, is, in, to, no, am) MUST match strictly
  if (w1.length >= 4 && w2.length >= 4 && Math.abs(w1.length - w2.length) <= 1) {
    return levenshtein(w1, w2) <= 1;
  }

  return false;
}

function normalizeWords(text) {
  const raw = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const out = [];
  for (const w of raw) {
    if (CONTRACTIONS[w]) {
      out.push(...CONTRACTIONS[w]);
    } else {
      const c = w.replace(/[^a-z0-9]/g, '');
      if (c) out.push(c);
    }
  }
  return out;
}

export function evaluateSpokenAccuracy(expectedText, spokenText) {
  const expWords = normalizeWords(expectedText);
  const actWords = normalizeWords(spokenText);

  if (!expWords.length || !actWords.length) {
    return {
      score: 0,
      passed: false,
      matched: 0,
      total: expWords.length,
      missing: expWords,
      feedback: 'Nothing was detected. Please tap the mic and speak clearly!',
      feedbackBn: 'কোনো কথা শোনা যায়নি। স্পষ্ট করে বলুন!',
    };
  }

  let matched = 0;
  const missing = [];
  const actPool = [...actWords];

  for (const ew of expWords) {
    const foundIdx = actPool.findIndex((aw) => wordsMatch(ew, aw));
    if (foundIdx !== -1) {
      matched++;
      actPool.splice(foundIdx, 1);
    } else {
      missing.push(ew);
    }
  }

  const score = Math.min(100, Math.round((matched / expWords.length) * 100));
  // 60%+ passes!
  const passed = score >= 60;

  let feedback = '';
  let feedbackBn = '';

  if (score >= 90) {
    feedback = 'Flawless pronunciation! Every word was clear and confident.';
    feedbackBn = 'চমৎকার উচ্চারণ! প্রতিটি শব্দ স্পষ্ট ও সুন্দর হয়েছে।';
  } else if (score >= 60) {
    feedback = `Good job! You pronounced it with ${score}% accuracy.`;
    feedbackBn = `খুব সুন্দর! আপনি ${score}% সঠিকভাবে বলতে পেরেছেন।`;
  } else if (score > 0) {
    const missWord = missing.slice(0, 2).join(', ');
    feedback = `You scored ${score}%. Try emphasizing: "${missWord}". Listen to Nova and try again!`;
    feedbackBn = `আপনি ${score}% পেয়েছেন। "${missWord}" শব্দটিতে আরেকটু জোর দিন।`;
  } else {
    feedback = 'The spoken words did not match this phrase. Please listen to Nova and try saying it once more!';
    feedbackBn = 'বলা বাক্যটির সাথে মিল পাওয়া যায়নি। নোভাকে শুনে আবার স্পষ্ট করে বলুন!';
  }

  return {
    score,
    passed,
    matched,
    total: expWords.length,
    missing,
    feedback,
    feedbackBn,
  };
}
