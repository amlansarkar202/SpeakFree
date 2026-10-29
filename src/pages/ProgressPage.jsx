import { Flame, Zap, BookOpen, Trophy, BarChart2, TrendingUp, Target, Calendar } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getAllLessons, LEVELS } from '../data/curriculum';

function Ring({ pct, size = 84, stroke = 8, color = '#3a7cf8', bg = '#1e2d45' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

const ACHIEVEMENTS = [
  { id: 'first_lesson', icon: '🌱', title: 'First Step', desc: 'Complete your first lesson', xp: 1 },
  { id: 'streak_3',     icon: '🔥', title: 'On Fire!',   desc: '3-day streak',             streak: 3 },
  { id: 'streak_7',     icon: '⚡', title: 'Lightning',  desc: '7-day streak',             streak: 7 },
  { id: 'lessons_5',    icon: '📚', title: 'Bookworm',   desc: '5 lessons completed',      lessons: 5 },
  { id: 'lessons_10',   icon: '🏆', title: 'Scholar',    desc: '10 lessons completed',     lessons: 10 },
  { id: 'xp_100',       icon: '💎', title: 'Diamond',    desc: 'Earn 100 total XP',        totalXP: 100 },
];

export default function ProgressPage() {
  const theme            = useAppStore((s) => s.theme);
  const todayProgress    = useAppStore((s) => s.todayProgress);
  const completedLessons = useAppStore((s) => s.completedLessons);
  const userProfile      = useAppStore((s) => s.userProfile);

  const isDark    = theme === 'dark';
  const levelKey  = userProfile?.level || 'beginner';
  const allLessons = getAllLessons(levelKey);
  const totalXP   = todayProgress.xpEarned;
  const coursePct = allLessons.length
    ? Math.round((completedLessons.length / allLessons.length) * 100)
    : 0;
  const xpPct = Math.min(100, Math.round((todayProgress.xpEarned / todayProgress.xpGoal) * 100));

  function unlocked(ach) {
    if (ach.xp) return completedLessons.length >= ach.xp;
    if (ach.streak) return todayProgress.streak >= ach.streak;
    if (ach.lessons) return completedLessons.length >= ach.lessons;
    if (ach.totalXP) return totalXP >= ach.totalXP;
    return false;
  }

  function card(extra = '') {
    return `${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8] shadow-xs'} border rounded-2xl ${extra}`;
  }
  function text(extra = '') { return `${isDark ? 'text-white' : 'text-slate-800'} ${extra}`; }
  function sub(extra = '') { return `${isDark ? 'text-slate-400' : 'text-slate-500'} ${extra}`; }

  const levelObj = LEVELS.find((l) => l.id === levelKey);

  return (
    <div className={`flex-1 min-h-screen pb-28 lg:pb-10 transition-colors ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${text()}`}>Your Fluency Progress</h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${sub()}`}>আপনার শেখার অগ্রগতি ও প্রাপ্তি</p>
        </div>

        {/* Level + Ring Card */}
        <div className={`${card('p-4 sm:p-5')} flex items-center gap-4 sm:gap-6`}>
          <div className="relative shrink-0">
            <Ring pct={coursePct} size={84} stroke={8} color="#3a7cf8" bg={isDark ? '#1e2d45' : '#dbeafe'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg sm:text-xl font-black ${text()}`}>{coursePct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${sub()}`}>Course Completion</p>
            <p className={`text-base sm:text-lg font-bold truncate ${text()}`}>{levelObj?.emoji} {levelObj?.label} Tier</p>
            <p className={`text-xs sm:text-sm ${sub()}`}>{completedLessons.length} of {allLessons.length} lessons mastered</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Flame size={14} className="text-accent-500 fill-accent-500" />
              <span className={`text-xs font-bold ${isDark ? 'text-accent-400' : 'text-accent-500'}`}>
                {todayProgress.streak} day speaking streak
              </span>
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div>
          <h2 className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 ${sub()}`}>Today's Activity</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: Zap,       val: `${todayProgress.xpEarned} XP`,       label: 'XP Earned',       color: 'text-warn-500' },
              { icon: BookOpen,  val: todayProgress.lessonsCompleted,        label: 'Lessons Done',    color: 'text-brand-500' },
              { icon: Target,    val: `${xpPct}%`,                           label: 'Goal Progress',   color: 'text-success-500' },
              { icon: Calendar,  val: `${todayProgress.practiceMinutes || 0}m`, label: 'Speaking Time',   color: 'text-accent-500' },
            ].map(({ icon: Icon, val, label, color }) => (
              <div key={label} className={`${card('p-3 sm:p-4')} flex items-center gap-2.5 sm:gap-3 min-w-0`}>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5' : 'bg-brand-50'}`}>
                  <Icon size={17} className={color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm sm:text-lg font-bold truncate ${text()}`}>{val}</p>
                  <p className={`text-[10px] sm:text-xs truncate ${sub()}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily XP bar */}
        <div className={card('p-4 sm:p-5')}>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Target size={16} className="text-brand-500 shrink-0" />
              <p className={`text-xs sm:text-sm font-bold truncate ${text()}`}>Daily Goal Target</p>
            </div>
            <p className={`text-xs sm:text-sm font-black shrink-0 ${isDark ? 'text-warn-400' : 'text-warn-500'}`}>
              {todayProgress.xpEarned} / {todayProgress.xpGoal} XP
            </p>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-100'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-warn-400 to-accent-500 transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className={`text-[11px] sm:text-xs mt-2 ${sub()}`}>
            {xpPct >= 100 ? '🎉 Goal accomplished today!' : `${todayProgress.xpGoal - todayProgress.xpEarned} XP more to hit today's fluency target`}
          </p>
        </div>

        {/* Achievements Grid */}
        <div>
          <h2 className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 ${sub()}`}>Badges & Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const earned = unlocked(ach);
              return (
                <div
                  key={ach.id}
                  className={`${card('p-3 sm:p-4 text-center')} transition-all
                    ${earned
                      ? isDark ? 'border-warn-500/40 bg-warn-500/5' : 'border-warn-300 bg-warn-50/50 shadow-xs'
                      : 'opacity-40'}
                  `}
                >
                  <div className={`text-2xl sm:text-3xl mb-1 ${earned ? '' : 'grayscale'}`}>{ach.icon}</div>
                  <p className={`text-xs font-bold truncate ${earned ? (isDark ? 'text-warn-400' : 'text-warn-600') : sub()}`}>
                    {ach.title}
                  </p>
                  <p className={`text-[10px] sm:text-[11px] mt-0.5 line-clamp-2 ${sub()}`}>{ach.desc}</p>
                  {earned && (
                    <div className="mt-1.5 text-[9px] font-black text-warn-500 uppercase tracking-wider">Unlocked ✓</div>
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
