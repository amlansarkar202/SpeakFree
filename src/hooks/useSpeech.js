// SpeakFree Natural Bilingual Speech Engine (TTS + STT)
// Features:
// 1. Dual-engine TTS: High-fidelity natural female audio via Google Studio TTS with fallback to browser Neural/Natural female voices
// 2. Bilingual text splitting: Speaks Bengali parts with native Bengali voice, English parts with natural English female voice
// 3. Web Speech Recognition for accurate Speech-to-Text

import { useState, useCallback, useRef, useEffect } from 'react';

// Split bilingual text into natural sentence-level language segments
function splitBilingualText(text) {
  const clean = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_~`#[\]()]/g, ' ')
    .trim();

  if (!clean) return [];

  const segments = [];
  const sentences = clean.split(/(?<=[.!?।\n])\s+/);

  for (const sent of sentences) {
    const trimmed = sent.trim();
    if (!trimmed) continue;

    const hasBengali = /[\u0980-\u09FF]/.test(trimmed);
    const hasEnglish = /[a-zA-Z]/.test(trimmed);

    if (hasBengali && !hasEnglish) {
      segments.push({ text: trimmed, lang: 'bn' });
    } else if (!hasBengali && hasEnglish) {
      segments.push({ text: trimmed, lang: 'en' });
    } else {
      // Mixed sentence: segment by words
      const words = trimmed.split(/\s+/);
      let curr = { text: '', lang: '' };
      for (const w of words) {
        const isBn = /[\u0980-\u09FF]/.test(w);
        const lang = isBn ? 'bn' : 'en';
        if (!curr.lang || curr.lang === lang) {
          curr.text += (curr.text ? ' ' : '') + w;
          curr.lang = lang;
        } else {
          segments.push(curr);
          curr = { text: w, lang };
        }
      }
      if (curr.text) segments.push(curr);
    }
  }

  return segments.length > 0 ? segments : [{ text: clean, lang: 'en' }];
}

// ── HIGH-FIDELITY BILINGUAL TEXT-TO-SPEECH (TTS) ────────────────────────────
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const currentAudioRef = useRef(null);
  const synthRef = useRef(null);
  const isCancelledRef = useRef(false);

  // Stop any active playback immediately
  const stop = useCallback(() => {
    isCancelledRef.current = true;
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setSpeaking(false);
  }, []);

  // Play audio file via HTML5 Audio element
  const playAudioUrl = (url) => {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play().catch(() => resolve(false));
    });
  };

  // Browser speech synthesis fallback with natural female voice priority
  const speakWithBrowserSynth = (segment) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve(false);

      const utter = new SpeechSynthesisUtterance(segment.text);
      utter.rate = segment.lang === 'bn' ? 0.95 : 0.92;
      utter.pitch = 1.05; // Slightly higher, warm female tone

      const voices = window.speechSynthesis.getVoices();

      if (segment.lang === 'bn') {
        // Find Bengali voice
        utter.lang = 'bn-IN';
        const bnVoice = voices.find(
          (v) =>
            v.lang.startsWith('bn') ||
            v.name.toLowerCase().includes('bengali') ||
            v.name.toLowerCase().includes('bangla') ||
            v.name.toLowerCase().includes('tanishaa')
        );
        if (bnVoice) utter.voice = bnVoice;
      } else {
        // Find natural, human-like female English voice
        utter.lang = 'en-US';
        const preferredFemaleEn = voices.find(
          (v) =>
            (v.name.toLowerCase().includes('natural') ||
              v.name.toLowerCase().includes('neural') ||
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('jenny') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('google uk english female') ||
              v.name.toLowerCase().includes('samantha')) &&
            v.lang.startsWith('en')
        );
        if (preferredFemaleEn) {
          utter.voice = preferredFemaleEn;
        } else {
          // Fallback English voice, avoiding robotic 'David'
          const nonDavid = voices.find(
            (v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('david')
          );
          if (nonDavid) utter.voice = nonDavid;
        }
      }

      utter.onend = () => resolve(true);
      utter.onerror = () => resolve(false);
      window.speechSynthesis.speak(utter);
    });
  };

  // Main speak function: plays bilingual segments sequentially
  const speak = useCallback(async (text) => {
    if (!text) return;
    stop();
    isCancelledRef.current = false;
    setSpeaking(true);

    const segments = splitBilingualText(text);

    for (const segment of segments) {
      if (isCancelledRef.current) break;

      // 1. Play high-fidelity studio voice via /api/tts endpoint (supports fluent Bengali and English)
      const encoded = encodeURIComponent(segment.text.slice(0, 180));
      const ttsUrl = `/api/tts?lang=${segment.lang}&text=${encoded}`;

      const audioSuccess = await playAudioUrl(ttsUrl);

      // 2. If network audio failed (e.g. offline), fall back to browser Web Speech API
      if (!audioSuccess && !isCancelledRef.current) {
        await speakWithBrowserSynth(segment);
      }
    }

    if (!isCancelledRef.current) {
      setSpeaking(false);
    }
  }, [stop]);

  // Pre-load browser voices
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => stop();
  }, [stop]);

  return { speak, stop, speaking };
}

// ── SPEECH-TO-TEXT (STT) ────────────────────────────────────────────────────
export function useSTT() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const startListening = useCallback((options = {}) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = options.lang || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setTranscript(current);
    };

    recognition.onerror = (event) => {
      // Don't treat user silence as a crash
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      options.onEnd?.();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
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

  const resetTranscript = useCallback(() => setTranscript(''), []);

  return {
    listening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// ── REAL SPEECH ACCURACY CHECKER ────────────────────────────────────────────
// Calculates word-for-word accuracy and detects missing / mispronounced words
export function evaluateSpokenAccuracy(expectedText, spokenText) {
  const clean = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const expWords = clean(expectedText);
  const actWords = clean(spokenText);

  if (!expWords.length || !actWords.length) {
    return {
      score: 0,
      passed: false,
      matched: 0,
      total: expWords.length,
      missing: expWords,
      feedback: 'Nothing was detected. Please hold the mic and speak clearly!',
      feedbackBn: 'কোনো কথা শোনা যায়নি। মাইক চেপে স্পষ্ট করে বলুন!',
    };
  }

  let matched = 0;
  const missing = [];

  for (const w of expWords) {
    if (actWords.includes(w)) {
      matched++;
    } else {
      missing.push(w);
    }
  }

  const score = Math.round((matched / expWords.length) * 100);
  const passed = score >= 70; // Must achieve at least 70% to pass

  let feedback = '';
  let feedbackBn = '';

  if (score === 100) {
    feedback = 'Flawless pronunciation! Every word was clear.';
    feedbackBn = 'চমৎকার উচ্চারণ! সব শব্দ নিখুঁত হয়েছে।';
  } else if (score >= 70) {
    feedback = `Great job! You got ${score}% accuracy.`;
    feedbackBn = `দারুণ হয়েছে! আপনি ${score}% সঠিকভাবে বলতে পেরেছেন।`;
  } else {
    const missWord = missing.slice(0, 2).join(', ');
    feedback = `You scored ${score}%. Try to emphasize: "${missWord}". Say it again!`;
    feedbackBn = `আপনি ${score}% পেয়েছেন। "${missWord}" শব্দটির ওপর জোর দিন। আবার বলুন!`;
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
