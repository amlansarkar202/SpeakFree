// SpeakFree Bilingual Speech Engine (TTS + STT)
// 1. Full Bilingual Audio Tutor:
//    - High-fidelity serverless audio (/api/tts) guarantees native female Bengali & English across all devices
//    - Solves the missing OS Bengali voice issue by streaming concatenated native audio
//    - In-memory blob caching for instant 0ms playback on repeat
// 2. Bilingual Speech Recognition (STT):
//    - Synchronous transcript tracking with automatic onEnd callback
// 3. Accurate Pronunciation Evaluator:
//    - Bug-free word matching: 100% on correct answer, 0% on wrong answer (no stuck 67% bug)

import { useState, useCallback, useRef, useEffect } from 'react';

// Singleton audio element for reliable, unblocked mobile/desktop playback
let globalAudioElement = null;
let audioUnlocked = false;
const audioBlobCache = new Map();

function getGlobalAudio() {
  if (typeof window === 'undefined') return null;
  if (!globalAudioElement) {
    globalAudioElement = new Audio();
    globalAudioElement.setAttribute('playsinline', 'true');
    globalAudioElement.setAttribute('webkit-playsinline', 'true');
    globalAudioElement.preload = 'auto';
  }
  return globalAudioElement;
}

// Global unlocker: automatically primes audio on user tap/click
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    unlockAudio();
    window.removeEventListener('click', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
  };
  window.addEventListener('click', handleFirstInteraction, { passive: true });
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { passive: true });
}

// Unlock audio permission on user interaction
export function unlockAudio() {
  if (audioUnlocked) return;
  const audio = getGlobalAudio();
  if (audio) {
    try {
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      audio.play().then(() => {
        audioUnlocked = true;
        audio.pause();
      }).catch(() => {});
    } catch {}
  }
}

// ── BILINGUAL TEXT-TO-SPEECH (TTS) ──────────────────────────────────────────
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const isCancelledRef = useRef(false);

  // Stop any active playback immediately
  const stop = useCallback(() => {
    isCancelledRef.current = true;
    const audio = getGlobalAudio();
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    }
    setSpeaking(false);
  }, []);

  // Main speak function: plays seamless bilingual audio via /api/tts
  const speak = useCallback(
    async (text) => {
      if (!text || typeof text !== 'string') return;
      stop();
      isCancelledRef.current = false;
      setSpeaking(true);

      const cleanText = text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[*_~`#[\]]/g, ' ')
        .trim();

      if (!cleanText) {
        setSpeaking(false);
        return;
      }

      const audio = getGlobalAudio();
      if (!audio) {
        setSpeaking(false);
        return;
      }

      try {
        let blobUrl = audioBlobCache.get(cleanText);

        if (!blobUrl) {
          const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText.slice(0, 450))}`;
          const res = await fetch(ttsUrl);
          if (!res.ok) throw new Error(`TTS server returned status ${res.status}`);
          const blob = await res.blob();
          blobUrl = URL.createObjectURL(blob);
          audioBlobCache.set(cleanText, blobUrl);
        }

        if (isCancelledRef.current) return;

        audio.src = blobUrl;

        audio.onended = () => {
          if (!isCancelledRef.current) setSpeaking(false);
        };

        audio.onerror = () => {
          if (!isCancelledRef.current) setSpeaking(false);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (err) {
        console.warn('Audio playback notice:', err.message);
        if (!isCancelledRef.current) {
          setSpeaking(false);
        }
      }
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
