import { Zap, Flame, BookOpen, MessageCircle, Target, ChevronRight, Mic, Trophy, Star } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CURRICULUM, LEVELS, getAllLessons } from '../data/curriculum';

function StatCard({ icon: Icon, value, label, color, theme }) {
  return (
    <div className={`
      p-4 rounded-2xl flex items-center gap-3
      ${theme === 'dark' ? 'bg-[#161f2e] border border-[#1e2d45]' : 'bg-white border border-[#c7d7f8]'}
    `}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const theme         = useAppStore((s) => s.theme);
  const userProfile   = useAppStore((s) => s.userProfile);
  const todayProgress = useAppStore((s) => s.todayProgress);
  const completedLessons = useAppStore((s) => s.completedLessons);
  const setActivePage = useAppStore((s) => s.setActivePage);

  const isDark = theme === 'dark';
  const levelKey = userProfile?.level || 'beginner';
  const allLessons = getAllLessons(levelKey);
  const nextLesson = allLessons.find((l) => !completedLessons.includes(l.id));

  const xpPct = Math.min(100, Math.round((todayProgress.xpEarned / todayProgress.xpGoal) * 100));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingBn = hour < 12 ? 'সুপ্রভাত' : hour < 17 ? 'শুভ বিকেল' : 'শুভ সন্ধ্যা';

  const units = CURRICULUM[levelKey] || CURRICULUM.beginner;

  return (
    <div className={`flex-1 min-h-screen pb-20 md:pb-0 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {greetingBn} · {greeting}
            </p>
            <h2 className={`text-2xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {userProfile?.name} 👋
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${isDark ? 'bg-[#161f2e] text-warn-400' : 'bg-warn-400/10 text-warn-500'}`}>
              <Flame size={15} /> {todayProgress.streak}
            </div>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 shadow-xl shadow-brand-600/20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white" />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-brand-200 text-xs font-medium mb-0.5">Today's Goal</p>
                <h3 className="text-white font-bold text-lg">Daily XP Challenge</h3>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-2xl">{todayProgress.xpEarned}</p>
                <p className="text-brand-200 text-xs">/ {todayProgress.xpGoal} XP</p>
              </div>
            </div>
            <div className="h-2 bg-brand-900/50 rounded-full mb-3">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-warn-400 to-accent-400 transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-brand-200 text-xs">
                {xpPct >= 100
                  ? '🎉 Goal reached! Amazing!'
                  : `${todayProgress.xpGoal - todayProgress.xpEarned} XP to go!`}
              </p>
              <button
                onClick={() => setActivePage('learn')}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-all"
              >
                Continue <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Zap}       value={`${todayProgress.xpEarned} XP`} label="XP Earned Today"  color="bg-warn-500"    theme={theme} />
          <StatCard icon={BookOpen}  value={todayProgress.lessonsCompleted}  label="Lessons Done"      color="bg-brand-600"  theme={theme} />
          <StatCard icon={Flame}     value={`${todayProgress.streak}d`}      label="Streak"            color="bg-accent-500" theme={theme} />
          <StatCard icon={Trophy}    value={completedLessons.length}          label="Total Completed"  color="bg-success-500" theme={theme} />
        </div>

        {/* Next Lesson */}
        {nextLesson && (
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              📌 Continue Where You Left Off
            </h3>
            <button
              onClick={() => setActivePage('learn')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]
                ${isDark ? 'bg-[#161f2e] border-[#1e2d45] hover:border-brand-500/40' : 'bg-white border-[#c7d7f8] hover:border-brand-300'}
                shadow-sm`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {nextLesson.title}
                </p>
                <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {nextLesson.titleBn}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-brand-500/20 text-brand-400' : 'bg-brand-100 text-brand-600'}`}>
                    {nextLesson.type}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ~{nextLesson.duration} min · +{nextLesson.xp} XP
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            ⚡ Quick Practice
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActivePage('chat')}
              className="p-4 rounded-2xl bg-gradient-to-br from-success-500 to-emerald-600 text-white shadow-lg shadow-success-500/20 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle size={22} className="mb-2" />
              <p className="font-semibold text-sm">Talk to Nova</p>
              <p className="text-[11px] text-green-100">AI Tutor is online!</p>
            </button>
            <button
              onClick={() => setActivePage('learn')}
              className="p-4 rounded-2xl bg-gradient-to-br from-accent-500 to-orange-600 text-white shadow-lg shadow-accent-500/20 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic size={22} className="mb-2" />
              <p className="font-semibold text-sm">Speaking Practice</p>
              <p className="text-[11px] text-orange-100">Practice pronunciation</p>
            </button>
          </div>
        </div>

        {/* Course Overview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              📚 Your Course
            </h3>
            <button
              onClick={() => setActivePage('learn')}
              className="text-xs text-brand-500 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {units.map((unit) => {
              const done = unit.lessons.filter((l) => completedLessons.includes(l.id)).length;
              const pct = Math.round((done / unit.lessons.length) * 100);
              return (
                <div
                  key={unit.id}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border ${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8]'}`}
                >
                  <div className="text-2xl">{unit.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {unit.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`flex-1 h-1 rounded-full ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-100'}`}>
                        <div
                          className="h-1 rounded-full bg-brand-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {done}/{unit.lessons.length}
                      </span>
                    </div>
                  </div>
                  {done === unit.lessons.length && (
                    <Star size={16} className="text-warn-400 fill-warn-400" />
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
