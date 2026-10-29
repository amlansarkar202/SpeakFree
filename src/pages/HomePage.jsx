import { useState } from 'react';
import { Zap, Flame, BookOpen, MessageCircle, Target, ChevronRight, Mic, Trophy, Star, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CURRICULUM, getAllLessons } from '../data/curriculum';
import LessonView from '../components/LessonView';
import { useTTS } from '../hooks/useSpeech';

function StatCard({ icon: Icon, value, label, color, theme }) {
  const isDark = theme === 'dark';
  return (
    <div className={`
      p-3 sm:p-4 rounded-2xl flex items-center gap-2.5 sm:gap-3 transition-all min-w-0
      ${isDark ? 'bg-[#161f2e] border border-[#1e2d45]' : 'bg-white border border-[#c7d7f8] shadow-xs'}
    `}>
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-base sm:text-xl font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {value}
        </p>
        <p className={`text-[10px] sm:text-xs font-medium truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const theme            = useAppStore((s) => s.theme);
  const userProfile      = useAppStore((s) => s.userProfile);
  const todayProgress    = useAppStore((s) => s.todayProgress);
  const completedLessons = useAppStore((s) => s.completedLessons);
  const setActivePage    = useAppStore((s) => s.setActivePage);

  const [activeLesson, setActiveLesson] = useState(null);
  const { speak, speaking } = useTTS();

  const isDark = theme === 'dark';
  const levelKey = userProfile?.level || 'beginner';
  const allLessons = getAllLessons(levelKey);
  const nextLesson = allLessons.find((l) => !completedLessons.includes(l.id)) || allLessons[0];

  const xpPct = Math.min(100, Math.round((todayProgress.xpEarned / todayProgress.xpGoal) * 100));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingBn = hour < 12 ? 'সুপ্রভাত' : hour < 17 ? 'শুভ বিকেল' : 'শুভ সন্ধ্যা';

  const units = CURRICULUM[levelKey] || CURRICULUM.beginner;

  function playNovaDailyTip() {
    const tip = `নমস্কার ${userProfile?.name || 'বন্ধু'}! Today's speaking goal is: ${nextLesson?.title}. যখন কথা বলবে, ভুল হওয়ার ভয় করবে না। Listen to my pronunciation, and repeat after me. Let us begin!`;
    speak(tip);
  }

  if (activeLesson) {
    return <LessonView lesson={activeLesson} onClose={() => setActiveLesson(null)} />;
  }

  return (
    <div className={`flex-1 min-h-screen pb-28 lg:pb-10 transition-colors ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
          <div>
            <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {greetingBn} · {greeting}
            </p>
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {userProfile?.name || 'Learner'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full ${
              isDark ? 'bg-brand-500/15 text-brand-300' : 'bg-brand-100 text-brand-700'
            }`}>
              🎯 Focus: {userProfile?.learningGoal || 'Daily English Fluency'}
            </span>
          </div>
        </div>

        {/* Nova Personal Mentor Calling Card */}
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
          isDark ? 'bg-[#161f2e] border-brand-500/30 shadow-lg shadow-brand-600/10' : 'bg-white border-brand-200 shadow-sm'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-600/30 ${speaking ? 'animate-pulse' : ''}`}>
                N
              </div>
              {speaking && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success-400 border-2 border-white animate-ping" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Nova — Your AI Mentor
                </span>
                <span className="text-[10px] bg-brand-500/15 text-brand-400 font-semibold px-2 py-0.5 rounded-full">
                  Bengali & English Spoken Coach
                </span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                "নমস্কার {userProfile?.name || 'বন্ধু'}! Today we will practice speaking: <strong>{nextLesson.title}</strong>. I will guide you phrase-by-phrase with live voice feedback!"
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setActiveLesson(nextLesson)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/30 cursor-pointer active:scale-95 transition-all"
                >
                  <Mic size={15} /> Start Spoken Class with Nova
                </button>
                <button
                  onClick={playNovaDailyTip}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    speaking
                      ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                      : isDark ? 'border-[#1e2d45] hover:bg-[#1e2d45] text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Volume2 size={15} /> {speaking ? 'Speaking...' : "Hear Nova's Greeting"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-4 sm:p-5 shadow-lg shadow-brand-600/20 text-white">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div>
              <p className="text-brand-200 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                Daily Goal Progress
              </p>
              <h2 className="text-white font-bold text-base sm:text-lg">
                {todayProgress.xpEarned >= todayProgress.xpGoal ? '🎉 Daily Mission Accomplished!' : 'Speaking Practice Mission'}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl sm:text-2xl font-black">{todayProgress.xpEarned}</span>
              <span className="text-brand-200 text-xs sm:text-sm font-medium"> / {todayProgress.xpGoal} XP</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="h-2 sm:h-2.5 bg-brand-950/40 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warn-400 to-accent-400 transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-brand-100 text-[11px] sm:text-xs">
              {xpPct >= 100
                ? 'Great speaking progress! You completed your daily goal.'
                : `${todayProgress.xpGoal - todayProgress.xpEarned} XP left to earn today.`}
            </p>
            <button
              onClick={() => setActiveLesson(nextLesson)}
              className="inline-flex items-center gap-1 font-semibold text-[11px] sm:text-xs bg-white/20 hover:bg-white/30 active:scale-95 px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer"
            >
              Practice Now <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCard icon={Zap}       value={`${todayProgress.xpEarned} XP`} label="Today's XP"     color="bg-warn-500"    theme={theme} />
          <StatCard icon={BookOpen}  value={todayProgress.lessonsCompleted}  label="Lessons Passed" color="bg-brand-600"  theme={theme} />
          <StatCard icon={Flame}     value={`${todayProgress.streak}d`}      label="Day Streak"     color="bg-accent-500" theme={theme} />
          <StatCard icon={Trophy}    value={completedLessons.length}          label="Total Mastered" color="bg-success-500" theme={theme} />
        </div>

        {/* Quick Practice Actions */}
        <div>
          <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Direct Spoken Practice
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <button
              onClick={() => setActivePage('chat')}
              className="p-4 rounded-2xl bg-gradient-to-br from-success-500 to-emerald-600 text-white shadow-md shadow-success-500/20 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <MessageCircle size={22} />
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Female Voice AI 🎙️
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base">1-on-1 Chat with Nova</p>
              <p className="text-xs text-emerald-100 mt-0.5">Talk freely in English or Bengali anytime</p>
            </button>

            <button
              onClick={() => setActiveLesson(nextLesson)}
              className="p-4 rounded-2xl bg-gradient-to-br from-accent-500 to-orange-600 text-white shadow-md shadow-accent-500/20 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <Mic size={22} />
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Pronunciation Drill 🎯
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base">Speech Accuracy Test</p>
              <p className="text-xs text-orange-100 mt-0.5">Real-time word match and pronunciation check</p>
            </button>
          </div>
        </div>

        {/* Course Roadmap */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Course Roadmap
            </h3>
            <button
              onClick={() => setActivePage('learn')}
              className="text-xs font-semibold text-brand-500 hover:text-brand-400 cursor-pointer"
            >
              Full Syllabus →
            </button>
          </div>

          <div className="space-y-2">
            {units.map((unit) => {
              const done = unit.lessons.filter((l) => completedLessons.includes(l.id)).length;
              const pct = Math.round((done / unit.lessons.length) * 100);
              return (
                <div
                  key={unit.id}
                  onClick={() => setActivePage('learn')}
                  className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer hover:border-brand-500/40
                    ${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8] shadow-xs'}`}
                >
                  <div className="text-2xl shrink-0">{unit.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {unit.title}
                      </p>
                      <span className={`text-[10px] sm:text-xs font-semibold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {done}/{unit.lessons.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-100'}`}>
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-brand-500 shrink-0">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {done === unit.lessons.length ? (
                    <Star size={16} className="text-warn-400 fill-warn-400 shrink-0" />
                  ) : (
                    <ChevronRight size={16} className={`shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
