import { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, X, Mic, MicOff, CheckCircle2, AlertCircle, Zap, Sparkles, RefreshCw, Award, ArrowRight, Square } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useTTS, useSTT, evaluateSpokenAccuracy, unlockAudio } from '../hooks/useSpeech';
import { evaluateResponse } from '../services/geminiService';

export default function LessonView({ lesson, onClose }) {
  const theme           = useAppStore((s) => s.theme);
  const markLessonDone  = useAppStore((s) => s.markLessonDone);
  const completedLesson = useAppStore((s) => s.completedLesson);
  const userProfile     = useAppStore((s) => s.userProfile);

  const phrases = lesson.content?.phrases || [
    { english: 'Hello, nice to meet you.', bengali: 'নমস্কার, আপনার সাথে দেখা হয়ে ভালো লাগলো।' },
    { english: 'How are you doing today?', bengali: 'আজকে আপনি কেমন আছেন?' },
  ];
  const challengePrompt = lesson.content?.practicePrompt || 'Introduce yourself in English and tell me what you like doing in your free time.';

  const totalSteps = phrases.length + 1; // phrases + conversational challenge
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Verification state for current phrase
  const [phrasePassed, setPhrasePassed] = useState(false);
  const [phraseAccuracy, setPhraseAccuracy] = useState(null);

  // Conversational challenge state
  const [challengePassed, setChallengePassed] = useState(false);
  const [challengeFeedback, setChallengeFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // Audio / Speech
  const { speak, stop, speaking } = useTTS();
  const { listening, transcript, startListening, stopListening, resetTranscript } = useSTT();

  const isDark = theme === 'dark';

  const isChallengeStep = currentStepIndex === phrases.length;
  const isCompletedStep = currentStepIndex > phrases.length;
  const currentPhrase = !isChallengeStep && !isCompletedStep ? phrases[currentStepIndex] : null;

  // Stop audio on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Current verbal instruction from Nova
  function getStepIntro() {
    if (currentPhrase) {
      return `চলো এটা শিখি: "${currentPhrase.english}". মানে হলো: ${currentPhrase.bengali}. Listen carefully: "${currentPhrase.english}". Now repeat after me!`;
    } else if (isChallengeStep) {
      return `দারুণ! সবকটি বাক্য তুমি সুন্দর বলেছ। Now let's test your real conversational speaking: "${challengePrompt}". Tap the mic and answer me in English!`;
    }
    return '';
  }

  // Attempt verbal introduction when step changes
  useEffect(() => {
    resetTranscript();
    setPhrasePassed(false);
    setPhraseAccuracy(null);
    const intro = getStepIntro();
    if (intro) {
      speak(intro);
    }
  }, [currentStepIndex]);

  // Handle Phrase Speech Verification (Repeating English phrase)
  async function handlePhraseMicToggle() {
    unlockAudio();
    if (listening) {
      stopListening();
      if (!transcript.trim()) {
        speak('কোনো কথা শোনা যায়নি। মাইক চেপে স্পষ্ট করে ইংরেজি বাক্যটি বলো!');
        return;
      }

      // Check strict speech accuracy against target English phrase
      const result = evaluateSpokenAccuracy(currentPhrase.english, transcript);
      setPhraseAccuracy(result);

      if (result.passed) {
        setPhrasePassed(true);
        speak(`দারুণ হয়েছে! You pronounced it with ${result.score}% accuracy. Excellent! Tap next to continue.`);
      } else {
        setPhrasePassed(false);
        const missingWords = result.missing.length > 0 ? result.missing.join(', ') : 'clarity';
        speak(`Almost! You got ${result.score}%. Remember to emphasize: "${missingWords}". Listen to me again: "${currentPhrase.english}". Try one more time!`);
      }
    } else {
      resetTranscript();
      setPhraseAccuracy(null);
      startListening({ lang: 'en-US' });
    }
  }

  // Handle Open Challenge Evaluation via Gemini AI
  async function handleChallengeMicToggle() {
    unlockAudio();
    if (listening) {
      stopListening();
      if (!transcript.trim()) {
        speak('Please speak your answer into the microphone so I can evaluate your English!');
        return;
      }

      setEvaluating(true);
      const evalResult = await evaluateResponse(transcript, challengePrompt, userProfile);
      setEvaluating(false);
      setChallengeFeedback({ ...evalResult, userSpoken: transcript });

      if (evalResult.passed) {
        setChallengePassed(true);
        speak(evalResult.spokenFeedback || 'অসাধারণ! You spoke naturally and clearly. You passed the challenge!');
      } else {
        setChallengePassed(false);
        speak(evalResult.spokenFeedback || 'Good try! Listen to my suggestion and try saying your answer once more.');
      }
    } else {
      resetTranscript();
      setChallengeFeedback(null);
      startListening({ lang: 'en-US' });
    }
  }

  // Advance to next step (ONLY allowed if passed!)
  function handleNext() {
    unlockAudio();
    if (isChallengeStep) {
      if (!challengePassed) return;
      markLessonDone(lesson.id);
      completedLesson(lesson.xp);
      setCurrentStepIndex(totalSteps); // move to graduation celebration
      speak(`Congratulations ${userProfile?.name || 'বন্ধু'}! You completed ${lesson.title} and earned ${lesson.xp} XP! I am so proud of your progress today!`);
    } else {
      if (!phrasePassed) return;
      setCurrentStepIndex((prev) => prev + 1);
    }
  }

  function card(extra = '') {
    return `${isDark ? 'bg-[#191e28] border-[#252d3a]' : 'bg-white border-[#dbe0e8] shadow-xs'} border rounded-2xl ${extra}`;
  }
  function text(extra = '') { return `${isDark ? 'text-white' : 'text-slate-800'} ${extra}`; }
  function sub(extra = '') { return `${isDark ? 'text-slate-400' : 'text-slate-500'} ${extra}`; }

  // ── FINAL CELEBRATION & REAL XP SCREEN ─────────────────────────────────────
  if (isCompletedStep) {
    return (
      <div className={`flex-1 min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 pb-28 lg:pb-12 ${isDark ? 'bg-[#13171e]' : 'bg-[#f4f5f8]'}`}>
        <div className={`w-full max-w-md ${card('p-6 sm:p-8')} text-center animate-float-up`}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-warn-400 to-accent-500 flex items-center justify-center text-4xl shadow-xl shadow-warn-500/30 mb-4 animate-bounce">
            🏆
          </div>

          <h2 className={`text-xl sm:text-2xl font-black mb-1 ${text()}`}>
            Lesson Mastered!
          </h2>
          <p className={`text-xs sm:text-sm font-medium mb-5 ${isDark ? 'text-brand-300' : 'text-brand-700'}`}>
            {lesson.title} · Nova-র সাথে সফলভাবে শেষ করলেন!
          </p>

          {/* Genuine Verified Badges */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#252d3a]' : 'bg-brand-50'}`}>
              <p className="text-2xl font-black text-warn-400">+{lesson.xp}</p>
              <p className={`text-[11px] font-bold ${sub()}`}>Verified XP Earned</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#252d3a]' : 'bg-brand-50'}`}>
              <p className="text-2xl font-black text-success-400">Passed ✓</p>
              <p className={`text-[11px] font-bold ${sub()}`}>Speech Checked</p>
            </div>
          </div>

          <p className={`text-xs leading-relaxed mb-6 ${sub()}`}>
            "আজকে তুমি দারুণ ইংরেজি উচ্চারণ করেছো। প্রতিনিয়ত এভাবে কথা বললে তোমার ইংরেজিতে কথা বলার জড়তা দ্রুত কেটে যাবে!" — Nova
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all cursor-pointer active:scale-95"
          >
            Return to Syllabus 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-screen pb-28 lg:pb-12 transition-colors ${isDark ? 'bg-[#13171e]' : 'bg-[#f4f5f8]'}`}>
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">

        {/* Top Header with Progress Dots */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { stop(); onClose(); }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${isDark ? 'hover:bg-[#191e28] text-slate-400' : 'hover:bg-brand-100 text-slate-500'}`}
            >
              <X size={18} />
            </button>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                Interactive Class · Step {currentStepIndex + 1} of {totalSteps}
              </p>
              <h1 className={`text-sm sm:text-base font-bold truncate ${text()}`}>
                {lesson.title}
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              unlockAudio();
              if (speaking) {
                stop();
              } else {
                const intro = getStepIntro();
                if (intro) speak(intro);
              }
            }}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              speaking
                ? 'bg-red-500 text-white animate-pulse'
                : isDark ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' : 'bg-brand-100 text-brand-700 border border-brand-300 shadow-xs'
            }`}
            title="Hear Nova speak"
          >
            {speaking ? <Square size={13} className="fill-current" /> : <Volume2 size={14} />}
            <span>{speaking ? 'Stop' : 'Listen'}</span>
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-current/10 overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Nova Teacher Avatar Card */}
        <div className={`${card('p-4 sm:p-5')} flex items-start gap-3.5 relative overflow-hidden`}>
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-600/30 ${speaking ? 'animate-pulse' : ''}`}>
              N
            </div>
            {speaking && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success-400 border-2 border-white animate-ping" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold text-sm ${text()}`}>Nova</span>
              <span className="text-[10px] bg-brand-500/15 text-brand-400 font-semibold px-2 py-0.5 rounded-full">
                Your Bilingual Mentor
              </span>
              {speaking && (
                <div className="flex items-center gap-0.5 ml-auto">
                  <div className="w-1 rounded-full bg-brand-500 h-3 animate-bounce" />
                  <div className="w-1 rounded-full bg-brand-500 h-4 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1 rounded-full bg-brand-500 h-2 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${sub()}`}>
              {currentPhrase
                ? `আমার সাথে স্পষ্ট করে ইংরেজি বাক্যটি বলো। অন্তত ৭০% নির্ভুল না হলে পরের ধাপে যাওয়া যাবে না!`
                : `এবার বাস্তব পরিস্থিতিতে ইংরেজিতে উত্তর দেওয়ার পালা। চিন্তা না করে নিজের মতো করে বলো!`}
            </p>
          </div>
        </div>

        {/* ── STAGE 1: PHRASE SHADOWING & PRONUNCIATION DRILL ── */}
        {!isChallengeStep && currentPhrase && (
          <div className="space-y-4 animate-float-up">

            {/* Target Teaching Card */}
            <div className={`${card('p-5 sm:p-6 text-center')} border-brand-500/30`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                🎯 Phrase to Speak:
              </p>
              <h2 className={`text-xl sm:text-2xl font-extrabold mb-2 ${text()}`}>
                "{currentPhrase.english}"
              </h2>
              <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                🇧🇩 {currentPhrase.bengali}
              </p>

              <button
                onClick={() => {
                  unlockAudio();
                  speak(`Listen carefully: "${currentPhrase.english}". মানে হলো: ${currentPhrase.bengali}. Now say: "${currentPhrase.english}"`);
                }}
                className={`inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  isDark ? 'bg-[#252d3a] text-brand-300 hover:bg-[#253957]' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                }`}
              >
                <Volume2 size={14} /> Listen to Pronunciation (উচ্চারণ শুনুন)
              </button>
            </div>

            {/* Microphone Practice Studio */}
            <div className={`${card('p-5 text-center')}`}>
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <button
                    onClick={handlePhraseMicToggle}
                    className={`
                      w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer
                      ${listening
                        ? 'bg-red-500 shadow-red-500/40 scale-105 animate-pulse'
                        : 'bg-brand-600 shadow-brand-600/30 hover:scale-105 active:scale-95'}
                    `}
                  >
                    {listening ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}
                  </button>
                  {listening && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse-ring" />
                  )}
                </div>
              </div>

              <p className={`text-xs font-semibold ${text()}`}>
                {listening ? 'Listening to your voice... tap to finish' : 'Tap the mic and speak the phrase aloud in English'}
              </p>

              {transcript && (
                <div className={`mt-3 p-3 rounded-xl text-left border ${
                  isDark ? 'bg-[#252d3a] border-[#2a3f5e]' : 'bg-brand-50 border-brand-200'
                }`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${sub()}`}>What you said:</p>
                  <p className={`text-xs sm:text-sm font-semibold ${text()}`}>"{transcript}"</p>
                </div>
              )}

              {/* Accuracy Evaluation Result */}
              {phraseAccuracy && (
                <div className={`mt-4 p-4 rounded-xl border text-left animate-float-up ${
                  phraseAccuracy.passed
                    ? isDark ? 'bg-success-500/10 border-success-500/30 text-success-400' : 'bg-success-50 border-success-200 text-success-800'
                    : isDark ? 'bg-warn-500/10 border-warn-500/30 text-warn-400' : 'bg-warn-50 border-warn-200 text-warn-800'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                      {phraseAccuracy.passed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {phraseAccuracy.passed ? 'Pronunciation Verified! ✓' : 'Needs Practice (Under 70%)'}
                    </span>
                    <span className="text-xs font-black">
                      Score: {phraseAccuracy.score}%
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed">{phraseAccuracy.feedback}</p>
                  <p className="text-[11px] opacity-80 mt-1">{phraseAccuracy.feedbackBn}</p>
                </div>
              )}
            </div>

            {/* Next Button (STRICTLY LOCKED UNTIL PASSED) */}
            <button
              onClick={handleNext}
              disabled={!phrasePassed}
              className={`
                w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                ${phrasePassed
                  ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/30 cursor-pointer active:scale-98'
                  : isDark ? 'bg-[#252d3a] text-slate-500 cursor-not-allowed border border-[#2a3f5e]' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}
              `}
            >
              <span>{phrasePassed ? 'Correct! Continue to Next Step' : '🔒 Speak phrase correctly (70%+ accuracy) to unlock'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STAGE 2: REAL-WORLD CONVERSATIONAL CHALLENGE ── */}
        {isChallengeStep && (
          <div className="space-y-4 animate-float-up">

            {/* Scenario Challenge Card */}
            <div className={`${card('p-5 sm:p-6')}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-warn-400 shrink-0" />
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-warn-400' : 'text-warn-600'}`}>
                  Real-World Spoken Test
                </p>
              </div>
              <p className={`text-sm sm:text-base font-bold leading-relaxed mb-3 ${text()}`}>
                "{challengePrompt}"
              </p>
              <p className={`text-xs ${sub()}`}>
                Nova will evaluate your grammar, vocabulary, and natural sentence flow. You must score at least 65% to graduate!
              </p>
            </div>

            {/* Mic Studio for Open Conversation */}
            <div className={`${card('p-5 text-center')}`}>
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <button
                    onClick={handleChallengeMicToggle}
                    disabled={evaluating}
                    className={`
                      w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer
                      ${listening
                        ? 'bg-red-500 shadow-red-500/40 scale-105 animate-pulse'
                        : 'bg-brand-600 shadow-brand-600/30 hover:scale-105 active:scale-95'}
                      ${evaluating ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                    {listening ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}
                  </button>
                  {listening && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse-ring" />
                  )}
                </div>
              </div>

              <p className={`text-xs font-semibold ${text()}`}>
                {listening ? 'Listening to your answer... speak naturally' : 'Tap the microphone and speak your answer in English'}
              </p>

              {transcript && (
                <div className={`mt-3 p-3 rounded-xl text-left border ${
                  isDark ? 'bg-[#252d3a] border-[#2a3f5e]' : 'bg-brand-50 border-brand-200'
                }`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${sub()}`}>Your speech:</p>
                  <p className={`text-xs sm:text-sm font-semibold ${text()}`}>"{transcript}"</p>
                </div>
              )}

              {/* Evaluating Indicator */}
              {evaluating && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-brand-500">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Nova is analyzing your grammar, vocabulary, and flow...</span>
                </div>
              )}

              {/* Gemini AI Evaluation Report */}
              {challengeFeedback && (
                <div className={`mt-4 p-4 rounded-xl border text-left space-y-2.5 animate-float-up ${
                  challengeFeedback.passed
                    ? isDark ? 'bg-success-500/10 border-success-500/30 text-success-300' : 'bg-success-50 border-success-200 text-success-900'
                    : isDark ? 'bg-warn-500/10 border-warn-500/30 text-warn-300' : 'bg-warn-50 border-warn-200 text-warn-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                      {challengeFeedback.passed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {challengeFeedback.passed ? 'Challenge Passed! 🎉' : 'Needs Another Attempt'}
                    </span>
                    <span className="text-xs font-black">
                      Score: {challengeFeedback.score}/100
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed">{challengeFeedback.spokenFeedback}</p>

                  {challengeFeedback.correction && (
                    <div className={`p-2.5 rounded-lg border text-xs ${
                      isDark ? 'bg-black/20 border-white/10' : 'bg-white border-brand-200'
                    }`}>
                      <p className="font-bold text-brand-500 mb-0.5">✏️ Natural Native Phrasing:</p>
                      <p className="font-semibold italic">"{challengeFeedback.correction}"</p>
                    </div>
                  )}

                  {challengeFeedback.pronunciation_tip && (
                    <p className="text-[11px] opacity-80">
                      🔊 Tip: {challengeFeedback.pronunciation_tip}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Finish Lesson Button (LOCKED UNTIL PASSED) */}
            <button
              onClick={handleNext}
              disabled={!challengePassed}
              className={`
                w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                ${challengePassed
                  ? 'bg-success-500 hover:bg-success-600 text-white shadow-lg shadow-success-500/30 cursor-pointer active:scale-98'
                  : isDark ? 'bg-[#252d3a] text-slate-500 cursor-not-allowed border border-[#2a3f5e]' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}
              `}
            >
              <Award size={16} />
              <span>{challengePassed ? `Claim Lesson Completion (+${lesson.xp} XP)` : '🔒 Pass the speaking challenge (65%+) to complete'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
