// SpeakFree Natural Bilingual Speech Engine (TTS + STT)
// Features:
// 1. High-fidelity natural female audio via Google Studio TTS endpoint (/api/tts)
//    - Concatenates native female Bengali (বাংলা) & English into a single smooth MP3 stream
// 2. Bilingual Speech Recognition (STT):
//    - Listens in both Bengali (bn-IN/bn-BD) and English (en-US)
// 3. Robust browser audio unlocker to bypass Autoplay restrictions across mobile & desktop

import { useState, useCallback, useRef, useEffect } from 'react';

// Singleton audio element for reliable, unblocked mobile/desktop playback
let globalAudioElement = null;

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

// Unlock audio permission on user interaction
export function unlockAudio() {
  const audio = getGlobalAudio();
  if (audio && audio.paused && !audio.src) {
    // 0.05s silent audio buffer
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audio.play().then(() => {
      audio.pause();
      audio.removeAttribute('src');
    }).catch(() => {});
  }
}

// ── HIGH-FIDELITY BILINGUAL TEXT-TO-SPEECH (TTS) ────────────────────────────
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
        audio.removeAttribute('src');
      } catch {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setSpeaking(false);
  }, []);

  // Browser speech synthesis fallback (only used if network is completely offline)
  const speakWithBrowserSynth = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve(false);

      const hasBengali = /[\u0980-\u09FF]/.test(text);
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = hasBengali ? 0.95 : 0.92;
      utter.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      if (hasBengali) {
        utter.lang = 'bn-IN';
        const bnVoice = voices.find(
          (v) =>
            v.lang.startsWith('bn') ||
            v.name.toLowerCase().includes('bengali') ||
            v.name.toLowerCase().includes('bangla')
        );
        if (bnVoice) utter.voice = bnVoice;
      } else {
        utter.lang = 'en-US';
        const femaleEn = voices.find(
          (v) =>
            (v.name.toLowerCase().includes('natural') ||
              v.name.toLowerCase().includes('neural') ||
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('samantha')) &&
            v.lang.startsWith('en')
        );
        if (femaleEn) utter.voice = femaleEn;
      }

      utter.onend = () => resolve(true);
      utter.onerror = () => resolve(false);
      window.speechSynthesis.speak(utter);
    });
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

      const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText.slice(0, 450))}`;

      try {
        audio.src = ttsUrl;
        audio.onended = () => {
          if (!isCancelledRef.current) setSpeaking(false);
        };
        audio.onerror = async () => {
          if (!isCancelledRef.current) {
            // Fall back to browser synth if offline
            await speakWithBrowserSynth(cleanText);
            setSpeaking(false);
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (err) {
        console.warn('Audio play restricted or failed, falling back:', err);
        if (!isCancelledRef.current) {
          await speakWithBrowserSynth(cleanText);
          setSpeaking(false);
        }
      }
    },
    [stop, speakWithBrowserSynth]
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

    const recognition = new SpeechRecognition();
    // Support Bengali (bn-IN / bn-BD) or English (en-US / en-IN)
    recognition.lang = options.lang || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
      setTranscript('');
      unlockAudio(); // Unlock audio on user interaction
    };

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setTranscript(current);
    };

    recognition.onerror = (event) => {
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

// ── REAL SPEECH ACCURACY EVALUATOR ──────────────────────────────────────────
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
      feedback: 'Nothing was detected. Please tap the mic and speak clearly!',
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
  const passed = score >= 70;

  let feedback = '';
  let feedbackBn = '';

  if (score === 100) {
    feedback = 'Flawless pronunciation! Every word was spoken clearly.';
    feedbackBn = 'চমৎকার উচ্চারণ! সব শব্দ নিখুঁত হয়েছে।';
  } else if (score >= 70) {
    feedback = `Great job! You achieved ${score}% accuracy.`;
    feedbackBn = `দারুণ হয়েছে! আপনি ${score}% সঠিকভাবে বলতে পেরেছেন।`;
  } else {
    const missWord = missing.slice(0, 2).join(', ');
    feedback = `You scored ${score}%. Try to emphasize: "${missWord}". Repeat after me!`;
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
