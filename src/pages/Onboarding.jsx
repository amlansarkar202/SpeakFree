import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Mic, BookOpen, Target, Clock, Sparkles } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { LEARNING_GOALS, LEVELS, TIMELINES } from '../data/curriculum';
import { updateProfile } from '../services/authService';

const STEPS = ['welcome', 'name', 'goal', 'assessment', 'level', 'timeline', 'ready'];

export default function Onboarding() {
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const theme = useAppStore((s) => s.theme);
  const supabaseUser = useAppStore((s) => s.supabaseUser);
  const userProfile = useAppStore((s) => s.userProfile);
  const initialName = supabaseUser?.user_metadata?.display_name || supabaseUser?.displayName || userProfile?.name || '';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: initialName,
    goal: '',
    selfAssessment: '',  // reason for learning
    level: '',
    timeline: '30',
  });

  // Assessment questions to gauge English grip
  const [assessAnswers, setAssessAnswers] = useState([]);
  const assessQuestions = [
    {
      q: "আপনি কি ইংরেজিতে নিজেকে পরিচয় দিতে পারেন? (Can you introduce yourself in English?)",
      options: [
        { val: 'no', label: "না, একেবারেই পারি না" },
        { val: 'basic', label: "কিছুটা পারি, তবে ভুল হয়" },
        { val: 'yes', label: "হ্যাঁ, কিন্তু ধীরে ধীরে" },
        { val: 'fluent', label: "সহজে পারি" },
      ],
    },
    {
      q: "ইংরেজিতে কথা বলার সময় আপনি কী অনুভব করেন?",
      options: [
        { val: 'fear', label: "ভয় পাই, থমকে যাই" },
        { val: 'hesitate', label: "দ্বিধা করি, শব্দ ভুলে যাই" },
        { val: 'ok', label: "ঠিকঠাক চালিয়ে যাই" },
        { val: 'confident', label: "আত্মবিশ্বাসী, কিন্তু আরো উন্নতি করতে চাই" },
      ],
    },
    {
      q: "আপনি ইংরেজি কতটুকু পড়তে বা বুঝতে পারেন?",
      options: [
        { val: 'none', label: "খুব কম, প্রায় বুঝি না" },
        { val: 'simple', label: "সহজ বাক্য বুঝি" },
        { val: 'moderate', label: "বেশিরভাগ বুঝি" },
        { val: 'well', label: "প্রায় সব বুঝি" },
      ],
    },
  ];

  const isDark = theme === 'dark';

  function bg(extra = '') {
    return `${isDark ? 'bg-[#13171e]' : 'bg-[#f4f5f8]'} ${extra}`;
  }
  function card(extra = '') {
    return `${isDark ? 'bg-[#191e28] border-[#252d3a]' : 'bg-white border-[#dbe0e8]'} border rounded-2xl ${extra}`;
  }
  function text(extra = '') {
    return `${isDark ? 'text-white' : 'text-slate-800'} ${extra}`;
  }
  function sub(extra = '') {
    return `${isDark ? 'text-slate-400' : 'text-slate-500'} ${extra}`;
  }

  function autoLevel() {
    const vals = assessAnswers;
    const scores = { no: 0, none: 0, fear: 0, basic: 1, simple: 1, hesitate: 1, yes: 2, ok: 2, moderate: 2, fluent: 3, confident: 3, well: 3 };
    const total = vals.reduce((a, v) => a + (scores[v] || 0), 0);
    if (total <= 2) return 'beginner';
    if (total <= 5) return 'elementary';
    if (total <= 7) return 'intermediate';
    return 'advanced';
  }

  function next() {
    if (step === STEPS.indexOf('assessment')) {
      // Auto-suggest level from assessment
      const suggested = autoLevel();
      setForm((f) => ({ ...f, level: f.level || suggested }));
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  function finish() {
    const xpGoal = LEVELS.find((l) => l.id === form.level)?.xpGoal || 40;
    const finalProfile = {
      ...form,
      nativeLanguage: 'Bengali (বাংলা)',
      xpGoal,
    };
    setUserProfile(finalProfile);
    if (supabaseUser?.id) {
      updateProfile(supabaseUser.id, finalProfile);
    }
  }

  function canNext() {
    const s = STEPS[step];
    if (s === 'name') return form.name.trim().length >= 2;
    if (s === 'goal') return !!form.goal;
    if (s === 'assessment') return assessAnswers.length >= assessQuestions.length;
    if (s === 'level') return !!form.level;
    if (s === 'timeline') return !!form.timeline;
    return true;
  }

  const stepName = STEPS[step];

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-start sm:justify-center px-3 sm:px-6 py-4 sm:py-8 overflow-y-auto transition-colors ${bg()}`}>
      {/* Progress dots */}
      <div className="flex gap-1.5 my-3 sm:mb-6 shrink-0">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? 'w-6 bg-brand-500'
                : i < step
                  ? 'w-3 bg-brand-400'
                  : isDark ? 'w-3 bg-[#252d3a]' : 'w-3 bg-brand-200'
            }`}
          />
        ))}
      </div>

      <div className={`w-full max-w-lg ${card('p-4 sm:p-7')} animate-float-up my-auto`}>

        {/* ── WELCOME ── */}
        {stepName === 'welcome' && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-xl shadow-brand-600/30">
              <Mic size={36} className="text-white" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${text()}`}>SpeakFree-তে স্বাগতম!</h2>
            <p className={`text-sm leading-relaxed mb-1 ${sub()}`}>
              Welcome to <span className="text-brand-500 font-semibold">SpeakFree</span> — your free AI English tutor.
            </p>
            <p className={`text-sm leading-relaxed mb-6 ${sub()}`}>
              আমরা আপনাকে বাংলা থেকে ইংরেজি শিখতে সাহায্য করবো — একেবারে বিনামূল্যে।
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              {[
                { icon: '🤖', t: 'AI Voice Tutor', s: '২৪/৭ কথা বলুন Nova-র সাথে' },
                { icon: '🎯', t: 'Daily Goals', s: 'লক্ষ্য নির্ধারণ করুন প্রতিদিন' },
                { icon: '📈', t: 'Track Progress', s: 'আপনার উন্নতি দেখুন' },
                { icon: '🆓', t: '100% Free', s: 'কোনো পেমেন্ট নেই, কখনো না' },
              ].map(({ icon, t, s }) => (
                <div key={t} className={`p-3 rounded-xl ${isDark ? 'bg-[#252d3a]/60' : 'bg-brand-50'}`}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className={`text-xs font-semibold ${text()}`}>{t}</p>
                  <p className={`text-[11px] ${sub()}`}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NAME ── */}
        {stepName === 'name' && (
          <div>
            <div className="text-3xl mb-3">👋</div>
            <h2 className={`text-xl font-bold mb-1 ${text()}`}>আপনার নাম কী?</h2>
            <p className={`text-sm mb-5 ${sub()}`}>What's your name? We'll personalize your journey!</p>
            <input
              autoFocus
              type="text"
              placeholder="আপনার নাম লিখুন..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && canNext() && next()}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all
                ${isDark
                  ? 'bg-[#252d3a] border-[#2a3f5e] text-white placeholder-slate-500 focus:border-brand-500'
                  : 'bg-brand-50 border-brand-200 text-slate-800 placeholder-slate-400 focus:border-brand-500'}
                focus:ring-2 focus:ring-brand-500/20`}
            />
            <p className={`text-[11px] mt-2 ${sub()}`}>
              আপনার নাম শুধুমাত্র আপনার ডিভাইসে সেভ থাকবে।
            </p>
          </div>
        )}

        {/* ── GOAL ── */}
        {stepName === 'goal' && (
          <div>
            <Target size={28} className="text-brand-500 mb-3" />
            <h2 className={`text-xl font-bold mb-1 ${text()}`}>
              কেন ইংরেজি শিখতে চাইছেন, {form.name}?
            </h2>
            <p className={`text-sm mb-4 ${sub()}`}>Why do you want to learn English?</p>
            <div className="space-y-2">
              {LEARNING_GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setForm((f) => ({ ...f, goal: g.id, learningGoal: g.label }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                    ${form.goal === g.id
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm shadow-brand-500/20'
                      : isDark
                        ? 'border-[#252d3a] bg-[#252d3a]/40 hover:border-brand-500/40'
                        : 'border-brand-100 bg-brand-50 hover:border-brand-300'}
                  `}
                >
                  <span className="text-xl">{g.emoji}</span>
                  <div>
                    <p className={`text-sm font-semibold ${text()}`}>{g.label}</p>
                    <p className={`text-[11px] ${sub()}`}>{g.labelBn}</p>
                  </div>
                  {form.goal === g.id && (
                    <Check size={16} className="ml-auto text-brand-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ASSESSMENT ── */}
        {stepName === 'assessment' && (
          <div>
            <BookOpen size={28} className="text-accent-500 mb-3" />
            <h2 className={`text-xl font-bold mb-1 ${text()}`}>আপনার ইংরেজির মাত্রা বুঝি</h2>
            <p className={`text-sm mb-4 ${sub()}`}>Let's understand your current English level — it only takes 30 seconds!</p>
            <div className="space-y-5">
              {assessQuestions.map((q, qi) => (
                <div key={qi}>
                  <p className={`text-xs sm:text-sm font-semibold mb-2.5 ${text()}`}>{q.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const selected = assessAnswers[qi] === opt.val;
                      return (
                        <button
                          key={opt.val}
                          onClick={() => {
                            const arr = [...assessAnswers];
                            arr[qi] = opt.val;
                            setAssessAnswers(arr);
                          }}
                          className={`px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium border text-left transition-all cursor-pointer
                            ${selected
                              ? 'border-brand-500 bg-brand-500/15 text-brand-400 font-semibold shadow-xs'
                              : isDark
                                ? 'border-[#252d3a] bg-[#252d3a]/40 text-slate-300 hover:border-brand-500/40'
                                : 'border-brand-100 bg-brand-50 text-slate-600 hover:border-brand-300'}
                          `}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{opt.label}</span>
                            {selected && <Check size={14} className="text-brand-500 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEVEL ── */}
        {stepName === 'level' && (
          <div>
            <Sparkles size={28} className="text-warn-400 mb-3" />
            <h2 className={`text-xl font-bold mb-1 ${text()}`}>
              আপনার লেভেল নির্বাচন করুন
            </h2>
            <p className={`text-sm mb-1 ${sub()}`}>
              আমাদের মূল্যায়ন অনুযায়ী আপনি:{' '}
              <span className="text-brand-400 font-semibold capitalize">{autoLevel()}</span>
            </p>
            <p className={`text-xs mb-4 ${sub()}`}>You can also choose your own level.</p>
            <div className="space-y-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv.id}
                  onClick={() => setForm((f) => ({ ...f, level: lv.id }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                    ${form.level === lv.id
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm shadow-brand-500/20'
                      : isDark
                        ? 'border-[#252d3a] bg-[#252d3a]/40 hover:border-brand-500/40'
                        : 'border-brand-100 bg-brand-50 hover:border-brand-300'}
                  `}
                >
                  <span className="text-2xl">{lv.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${text()}`}>{lv.label}</p>
                      {lv.id === autoLevel() && (
                        <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                          Suggested
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ${sub()}`}>{lv.descBn}</p>
                  </div>
                  {form.level === lv.id && (
                    <Check size={16} className="text-brand-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {stepName === 'timeline' && (
          <div>
            <Clock size={28} className="text-success-500 mb-3" />
            <h2 className={`text-xl font-bold mb-1 ${text()}`}>প্রতিদিন কতটুকু সময় দেবেন?</h2>
            <p className={`text-sm mb-4 ${sub()}`}>How much time can you dedicate daily?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {TIMELINES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setForm((f) => ({ ...f, timeline: t.id, dailyMinutes: t.minutes }))}
                  className={`p-4 rounded-xl border text-center transition-all
                    ${form.timeline === t.id
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm shadow-brand-500/20'
                      : isDark
                        ? 'border-[#252d3a] bg-[#252d3a]/40 hover:border-brand-500/40'
                        : 'border-brand-100 bg-brand-50 hover:border-brand-300'}
                  `}
                >
                  <p className={`text-base font-bold mb-0.5 ${text()}`}>{t.label}</p>
                  <p className={`text-[11px] ${sub()}`}>{t.desc}</p>
                  {form.timeline === t.id && (
                    <div className="mt-1.5">
                      <Check size={14} className="mx-auto text-brand-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className={`text-xs mt-3 ${sub()}`}>
              💡 আপনি যেকোনো সময় এটি পরিবর্তন করতে পারবেন।
            </p>
          </div>
        )}

        {/* ── READY ── */}
        {stepName === 'ready' && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className={`text-2xl font-bold mb-2 ${text()}`}>
              সব সেট, {form.name}!
            </h2>
            <p className={`text-sm mb-6 ${sub()}`}>
              You're all set! Your personalized English course is ready. Let's start your journey to fluency!
            </p>
            <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-[#252d3a]/60' : 'bg-brand-50'} text-left`}>
              {[
                { label: 'Level', value: LEVELS.find((l) => l.id === form.level)?.label },
                { label: 'Goal', value: LEARNING_GOALS.find((g) => g.id === form.goal)?.label },
                { label: 'Daily', value: TIMELINES.find((t) => t.id === form.timeline)?.label },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b last:border-0 border-current/10">
                  <span className={`text-xs ${sub()}`}>{label}</span>
                  <span className={`text-xs font-semibold ${text()}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BUTTONS ── */}
        <div className={`flex gap-3 mt-6 ${step === 0 ? 'justify-center' : 'justify-between'}`}>
          {step > 0 && (
            <button
              onClick={back}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isDark
                  ? 'bg-[#252d3a] text-slate-300 hover:bg-[#2a3f5e]'
                  : 'bg-brand-100 text-slate-600 hover:bg-brand-200'}`}
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {stepName !== 'ready' ? (
            <button
              onClick={next}
              disabled={!canNext()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${step === 0 ? 'w-full justify-center' : 'ml-auto'}
                ${canNext()
                  ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/30'
                  : isDark ? 'bg-[#252d3a] text-slate-600 cursor-not-allowed' : 'bg-brand-100 text-slate-400 cursor-not-allowed'}
              `}
            >
              {step === 0 ? 'শুরু করুন (Get Started)' : 'Continue'} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={finish}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg shadow-brand-600/30 transition-all"
            >
              Start Learning! 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
