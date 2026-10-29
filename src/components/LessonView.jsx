import { useState } from 'react';
import { Volume2, ChevronRight, X, Mic, MicOff, CheckCircle, AlertCircle, Zap, Sparkles } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useTTS, useSTT } from '../hooks/useSpeech';
import { evaluateResponse } from '../services/geminiService';

export default function LessonView({ lesson, onClose }) {
  const theme           = useAppStore((s) => s.theme);
  const markLessonDone  = useAppStore((s) => s.markLessonDone);
  const completedLesson = useAppStore((s) => s.completedLesson);
  const userProfile     = useAppStore((s) => s.userProfile);

  const [phase, setPhase]     = useState('vocab'); // vocab | practice | result
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading]   = useState(false);

  const { speak, speaking } = useTTS();
  const { listening, transcript, startListening, stopListening, resetTranscript } = useSTT();

  const isDark = theme === 'dark';
  const vocab = lesson.content?.vocabulary || [];
  const phrases = lesson.content?.phrases || [];
  const practicePrompt = lesson.content?.practicePrompt || '';

  function card(extra = '') {
    return `${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8] shadow-xs'} border rounded-2xl ${extra}`;
  }
  function text(extra = '') { return `${isDark ? 'text-white' : 'text-slate-800'} ${extra}`; }
  function sub(extra = '') { return `${isDark ? 'text-slate-400' : 'text-slate-500'} ${extra}`; }

  async function handleSpeakCheck() {
    if (listening) {
      stopListening();
      if (!transcript.trim()) return;
      setLoading(true);
      const result = await evaluateResponse(transcript, practicePrompt, userProfile);
      setFeedback({ ...result, userSaid: transcript });
      setLoading(false);
    } else {
      resetTranscript();
      startListening({ onEnd: () => {} });
    }
  }

  function finishLesson() {
    markLessonDone(lesson.id);
    completedLesson(lesson.xp);
    setPhase('result');
  }

  if (phase === 'result') {
    return (
      <div className={`flex-1 min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 pb-28 lg:pb-12 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
        <div className={`w-full max-w-md ${card('p-6 sm:p-8')} text-center animate-float-up`}>
          <div className="text-5xl sm:text-6xl mb-3">🎉</div>
          <h2 className={`text-xl sm:text-2xl font-bold mb-1 ${text()}`}>Lesson Completed!</h2>
          <p className={`text-xs sm:text-sm mb-5 ${sub()}`}>{lesson.title} — দারুণ কাজ করেছো!</p>
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-black text-warn-400">+{lesson.xp}</p>
              <p className={`text-[11px] font-medium ${sub()}`}>XP Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-brand-500">{lesson.duration}m</p>
              <p className={`text-[11px] font-medium ${sub()}`}>Study Time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shadow-md shadow-brand-600/30 cursor-pointer"
          >
            Back to Syllabus 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-screen pb-28 lg:pb-12 transition-colors ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-xs font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lesson.titleBn}</p>
            <h1 className={`text-lg sm:text-xl font-bold truncate ${text()}`}>{lesson.title}</h1>
          </div>
          <button
            onClick={onClose}
            aria-label="Close lesson"
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${isDark ? 'hover:bg-[#161f2e] text-slate-400' : 'hover:bg-brand-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Phase Tabs */}
        <div className={`flex rounded-xl p-1 gap-1 ${isDark ? 'bg-[#161f2e] border border-[#1e2d45]' : 'bg-brand-100/70'}`}>
          {['vocab', 'practice'].map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer
                ${phase === p
                  ? 'bg-brand-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-brand-700'}
              `}
            >
              {p === 'vocab' ? '📖 1. Vocabulary & Phrases' : '🗣️ 2. Speaking Practice'}
            </button>
          ))}
        </div>

        {/* ── VOCAB PHASE ── */}
        {phase === 'vocab' && (
          <div className="space-y-4 animate-float-up">
            {/* Vocabulary list */}
            {vocab.length > 0 && (
              <div>
                <h2 className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${sub()}`}>
                  Vocabulary Words ({vocab.length})
                </h2>
                <div className="space-y-2">
                  {vocab.map((v, i) => (
                    <div key={i} className={`${card('p-3.5 sm:p-4')} flex items-start gap-3`}>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`font-bold text-sm sm:text-base ${text()}`}>{v.word}</p>
                          <button
                            onClick={() => speak(v.word)}
                            className={`p-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                              isDark ? 'hover:bg-[#1e2d45] text-brand-400' : 'hover:bg-brand-100 text-brand-600'
                            }`}
                          >
                            <Volume2 size={15} />
                          </button>
                        </div>
                        <p className={`text-xs mb-1 font-medium ${isDark ? 'text-brand-300' : 'text-brand-700'}`}>
                          🇧🇩 {v.meaning}
                        </p>
                        <p className={`text-xs italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          "{v.example}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phrases */}
            {phrases.length > 0 && (
              <div>
                <h2 className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${sub()}`}>
                  Everyday Conversational Phrases
                </h2>
                <div className="space-y-2">
                  {phrases.map((ph, i) => (
                    <div key={i} className={`${card('p-3.5')} flex items-center justify-between gap-3`}>
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-xs sm:text-sm ${text()}`}>{ph.english}</p>
                        <p className={`text-xs mt-0.5 ${sub()}`}>🇧🇩 {ph.bengali}</p>
                      </div>
                      <button
                        onClick={() => speak(ph.english)}
                        className={`p-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                          isDark ? 'hover:bg-[#1e2d45] text-brand-400' : 'hover:bg-brand-100 text-brand-600'
                        }`}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setPhase('practice')}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-600/30 cursor-pointer active:scale-98"
            >
              Continue to Speaking Practice <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── PRACTICE PHASE ── */}
        {phase === 'practice' && (
          <div className="space-y-4 animate-float-up">
            {/* Prompt Challenge Card */}
            <div className={`${card('p-4 sm:p-5')}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-warn-400" />
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-warn-400' : 'text-warn-600'}`}>
                  Your Speaking Challenge
                </p>
              </div>
              <p className={`text-sm sm:text-base leading-relaxed font-semibold ${text()}`}>{practicePrompt}</p>
            </div>

            {/* Voice Input Box */}
            <div className={`${card('p-5 sm:p-6')} text-center`}>
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <button
                    onClick={handleSpeakCheck}
                    disabled={loading}
                    className={`
                      w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer
                      ${listening
                        ? 'bg-red-500 shadow-red-500/40 scale-105'
                        : 'bg-brand-600 shadow-brand-600/30 hover:scale-105 active:scale-95'}
                      ${loading ? 'opacity-60 cursor-wait' : ''}
                    `}
                  >
                    {listening ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}
                  </button>
                  {listening && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse-ring" />
                  )}
                </div>
              </div>

              {/* Sound Wave Bars */}
              {listening && (
                <div className="flex items-center justify-center gap-1 mb-2.5 h-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="wave-bar w-1.5 rounded-full bg-brand-500" style={{ height: '100%' }} />
                  ))}
                </div>
              )}

              <p className={`text-xs font-medium ${sub()}`}>
                {listening ? '🎙️ Listening... tap to stop when finished speaking' : 'Tap the microphone and speak your answer in English'}
              </p>

              {transcript && (
                <div className={`mt-3 p-3 rounded-xl text-left border ${
                  isDark ? 'bg-[#1e2d45] border-[#2a3f5e]' : 'bg-brand-50 border-brand-200'
                }`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${sub()}`}>You said:</p>
                  <p className={`text-xs sm:text-sm font-medium ${text()}`}>{transcript}</p>
                </div>
              )}
            </div>

            {/* AI Evaluating Indicator */}
            {loading && (
              <div className={`${card('p-3.5')} flex items-center gap-3 animate-pulse`}>
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  N
                </div>
                <p className={`text-xs sm:text-sm font-medium ${sub()}`}>Nova AI is checking your pronunciation & grammar...</p>
              </div>
            )}

            {/* Feedback Card */}
            {feedback && (
              <div className={`${card('p-4 sm:p-5 space-y-3')}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    N
                  </div>
                  <p className={`text-xs sm:text-sm font-bold ${text()}`}>Nova's Evaluation</p>
                  <div className={`ml-auto flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black
                    ${feedback.score >= 70
                      ? isDark ? 'bg-success-500/20 text-success-400' : 'bg-success-100 text-success-700'
                      : isDark ? 'bg-warn-500/20 text-warn-400' : 'bg-warn-100 text-warn-600'}`}>
                    <Zap size={11} /> {feedback.score}/100
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${text()}`}>{feedback.feedback}</p>

                {feedback.correction && (
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-brand-500/10 border-brand-500/20' : 'bg-brand-50 border-brand-200'
                  }`}>
                    <p className="text-[11px] font-bold text-brand-500 mb-0.5">✏️ Better way to say it:</p>
                    <p className={`text-xs sm:text-sm italic font-medium ${text()}`}>"{feedback.correction}"</p>
                  </div>
                )}

                {feedback.pronunciation_tip && (
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-warn-500/10 border-warn-500/20' : 'bg-warn-50 border-warn-200'
                  }`}>
                    <p className="text-[11px] font-bold text-warn-500 mb-0.5">🔊 Pronunciation tip:</p>
                    <p className={`text-xs sm:text-sm font-medium ${text()}`}>{feedback.pronunciation_tip}</p>
                  </div>
                )}
              </div>
            )}

            {/* Finish Lesson Button */}
            <button
              onClick={finishLesson}
              className="w-full py-3.5 rounded-xl bg-success-500 hover:bg-success-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-success-500/25 cursor-pointer active:scale-98"
            >
              <CheckCircle size={16} /> Complete Lesson (+{lesson.xp} XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
