import { useState } from 'react';
import { Volume2, ChevronRight, X, Mic, MicOff, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useTTS, useSTT } from '../hooks/useSpeech';
import { evaluateResponse } from '../services/geminiService';

export default function LessonView({ lesson, onClose }) {
  const theme = useAppStore((s) => s.theme);
  const markLessonDone = useAppStore((s) => s.markLessonDone);
  const completedLesson = useAppStore((s) => s.completedLesson);
  const userProfile = useAppStore((s) => s.userProfile);

  const [phase, setPhase] = useState('vocab'); // vocab | practice | result
  const [vocabIdx, setVocabIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const { speak, speaking } = useTTS();
  const { listening, transcript, startListening, stopListening, resetTranscript } = useSTT();

  const isDark = theme === 'dark';
  const vocab = lesson.content?.vocabulary || [];
  const phrases = lesson.content?.phrases || [];
  const practicePrompt = lesson.content?.practicePrompt || '';

  function card(extra = '') {
    return `${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8]'} border rounded-2xl ${extra}`;
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
      <div className={`flex-1 min-h-screen flex flex-col items-center justify-center px-4 pb-20 md:pb-0 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
        <div className={`w-full max-w-md ${card('p-7')} text-center`}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className={`text-2xl font-bold mb-1 ${text()}`}>Lesson Complete!</h2>
          <p className={`text-sm mb-5 ${sub()}`}>{lesson.title} — দারুণ কাজ করেছো!</p>
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-warn-400">+{lesson.xp}</p>
              <p className={`text-xs ${sub()}`}>XP Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-400">{lesson.duration}m</p>
              <p className={`text-xs ${sub()}`}>Study Time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/30"
          >
            Back to Course 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-screen pb-20 md:pb-0 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lesson.titleBn}</p>
            <h2 className={`text-xl font-bold ${text()}`}>{lesson.title}</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-[#161f2e]' : 'hover:bg-brand-100'}`}>
            <X size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          </button>
        </div>

        {/* Phase tabs */}
        <div className={`flex rounded-xl p-1 gap-1 ${isDark ? 'bg-[#161f2e]' : 'bg-brand-50'}`}>
          {['vocab', 'practice'].map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize
                ${phase === p
                  ? 'bg-brand-600 text-white shadow'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-brand-700'}
              `}
            >
              {p === 'vocab' ? '📖 Vocabulary' : '🗣️ Practice'}
            </button>
          ))}
        </div>

        {/* ── VOCAB PHASE ── */}
        {phase === 'vocab' && (
          <div className="space-y-4">
            {/* Vocabulary cards */}
            {vocab.length > 0 && (
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${sub()}`}>
                  Vocabulary ({vocab.length} words)
                </h3>
                <div className="space-y-2">
                  {vocab.map((v, i) => (
                    <div key={i} className={`${card('p-4')} flex items-start gap-3`}>
                      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-bold text-base ${text()}`}>{v.word}</p>
                          <button
                            onClick={() => speak(v.word)}
                            className={`p-1 rounded-lg transition-all ${isDark ? 'hover:bg-[#1e2d45] text-brand-400' : 'hover:bg-brand-100 text-brand-600'} ${speaking ? 'opacity-50' : ''}`}
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                        <p className={`text-xs mb-1.5 ${sub()}`}>🇧🇩 {v.meaning}</p>
                        <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${sub()}`}>
                  Useful Phrases
                </h3>
                <div className="space-y-2">
                  {phrases.map((ph, i) => (
                    <div key={i} className={`${card('p-3.5')} flex items-center gap-3`}>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${text()}`}>{ph.english}</p>
                        <p className={`text-xs ${sub()}`}>🇧🇩 {ph.bengali}</p>
                      </div>
                      <button
                        onClick={() => speak(ph.english)}
                        className={`p-2 rounded-xl ${isDark ? 'hover:bg-[#1e2d45] text-brand-400' : 'hover:bg-brand-100 text-brand-600'}`}
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setPhase('practice')}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/30"
            >
              Now Let's Practice! <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── PRACTICE PHASE ── */}
        {phase === 'practice' && (
          <div className="space-y-4">
            {/* Prompt card */}
            <div className={`${card('p-5')}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${sub()}`}>
                🎯 Speaking Challenge
              </p>
              <p className={`text-sm leading-relaxed font-medium ${text()}`}>{practicePrompt}</p>
            </div>

            {/* Voice input */}
            <div className={`${card('p-5')} text-center`}>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <button
                    onClick={handleSpeakCheck}
                    disabled={loading}
                    className={`
                      w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl
                      ${listening
                        ? 'bg-red-500 shadow-red-500/40 scale-110'
                        : 'bg-brand-600 shadow-brand-600/40 hover:scale-105'}
                      ${loading ? 'opacity-60 cursor-wait' : ''}
                    `}
                  >
                    {listening ? <MicOff size={30} className="text-white" /> : <Mic size={30} className="text-white" />}
                  </button>
                  {listening && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse-ring" />
                  )}
                </div>
              </div>

              {/* Wave bars during listening */}
              {listening && (
                <div className="flex items-center justify-center gap-1 mb-3 h-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`wave-bar w-1.5 rounded-full bg-brand-500`} style={{ height: '100%' }} />
                  ))}
                </div>
              )}

              <p className={`text-xs ${sub()} mb-2`}>
                {listening ? '🎙️ Listening... tap to stop' : 'Tap the mic and speak your answer'}
              </p>

              {transcript && (
                <div className={`mt-3 p-3 rounded-xl text-left ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-50'}`}>
                  <p className={`text-xs font-medium mb-1 ${sub()}`}>You said:</p>
                  <p className={`text-sm ${text()}`}>{transcript}</p>
                </div>
              )}
            </div>

            {/* AI Feedback */}
            {loading && (
              <div className={`${card('p-4')} flex items-center gap-3`}>
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0 animate-pulse">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <p className={`text-sm ${sub()}`}>Nova is evaluating your response...</p>
              </div>
            )}

            {feedback && (
              <div className={`${card('p-4 space-y-3')}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                  <p className={`text-xs font-semibold ${text()}`}>Nova's Feedback</p>
                  <div className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                    ${feedback.score >= 70
                      ? isDark ? 'bg-success-500/20 text-success-400' : 'bg-success-100 text-success-700'
                      : isDark ? 'bg-warn-500/20 text-warn-400' : 'bg-warn-100 text-warn-600'}`}>
                    <Zap size={10} /> {feedback.score}/100
                  </div>
                </div>
                <p className={`text-sm leading-relaxed ${text()}`}>{feedback.feedback}</p>
                {feedback.correction && (
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-brand-50 border border-brand-200'}`}>
                    <p className={`text-xs font-medium mb-1 text-brand-500`}>✏️ Better way to say it:</p>
                    <p className={`text-sm italic ${text()}`}>"{feedback.correction}"</p>
                  </div>
                )}
                {feedback.pronunciation_tip && (
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-warn-500/10 border border-warn-500/20' : 'bg-warn-50 border border-warn-200'}`}>
                    <p className={`text-xs font-medium mb-1 text-warn-500`}>🔊 Pronunciation tip:</p>
                    <p className={`text-sm ${text()}`}>{feedback.pronunciation_tip}</p>
                  </div>
                )}
              </div>
            )}

            {/* Finish */}
            <button
              onClick={finishLesson}
              className="w-full py-3 rounded-xl bg-success-500 hover:bg-success-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-success-500/25"
            >
              <CheckCircle size={16} /> Complete Lesson (+{lesson.xp} XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
