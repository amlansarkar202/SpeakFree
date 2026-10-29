import { Flame, Zap, BookOpen, Trophy, BarChart2, TrendingUp, Target, Calendar } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getAllLessons, LEVELS } from '../data/curriculum';

function Ring({ pct, size = 80, stroke = 8, color = '#3a7cf8', bg = '#1e2d45' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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
  const totalXP   = todayProgress.xpEarned; // simplification for alpha
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
    return `${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8]'} border rounded-2xl ${extra}`;
  }
  function text(extra = '') { return `${isDark ? 'text-white' : 'text-slate-800'} ${extra}`; }
  function sub(extra = '') { return `${isDark ? 'text-slate-400' : 'text-slate-500'} ${extra}`; }

  const levelObj = LEVELS.find((l) => l.id === levelKey);

  return (
    <div className={`flex-1 min-h-screen pb-20 md:pb-0 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <div>
          <h2 className={`text-2xl font-bold ${text()}`}>Your Progress</h2>
          <p className={`text-sm mt-0.5 ${sub()}`}>আপনার অগ্রগতির সারসংক্ষেপ</p>
        </div>

        {/* Level + Ring */}
        <div className={`${card('p-5')} flex items-center gap-5`}>
          <div className="relative shrink-0">
            <Ring pct={coursePct} size={90} stroke={9} color="#3a7cf8" bg={isDark ? '#1e2d45' : '#dbeafe'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${text()}`}>{coursePct}%</span>
            </div>
          </div>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${sub()}`}>Course Progress</p>
            <p className={`text-lg font-bold ${text()}`}>{levelObj?.emoji} {levelObj?.label}</p>
            <p className={`text-sm ${sub()}`}>{completedLessons.length} of {allLessons.length} lessons done</p>
            <div className="flex items-center gap-2 mt-2">
              <Flame size={13} className="text-accent-400" />
              <span className={`text-xs font-semibold ${isDark ? 'text-accent-400' : 'text-accent-500'}`}>
                {todayProgress.streak} day streak
              </span>
            </div>
          </div>
        </div>

        {/* Today's stats */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${sub()}`}>Today</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Zap,       val: `${todayProgress.xpEarned} XP`,       label: 'XP Earned',       color: 'text-warn-400' },
              { icon: BookOpen,  val: todayProgress.lessonsCompleted,        label: 'Lessons',         color: 'text-brand-400' },
              { icon: Target,    val: `${xpPct}%`,                           label: 'Daily Goal',      color: 'text-success-400' },
              { icon: Calendar,  val: `${todayProgress.practiceMinutes || 0}m`, label: 'Practice Time', color: 'text-accent-400' },
            ].map(({ icon: Icon, val, label, color }) => (
              <div key={label} className={`${card('p-4')} flex items-center gap-3`}>
                <Icon size={20} className={color} />
                <div>
                  <p className={`text-lg font-bold ${text()}`}>{val}</p>
                  <p className={`text-[11px] ${sub()}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily XP bar */}
        <div className={card('p-4')}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-brand-500" />
              <p className={`text-sm font-semibold ${text()}`}>Daily XP Goal</p>
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-warn-400' : 'text-warn-500'}`}>
              {todayProgress.xpEarned} / {todayProgress.xpGoal}
            </p>
          </div>
          <div className={`h-3 rounded-full ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-100'}`}>
            <div
              className="h-3 rounded-full bg-gradient-to-r from-warn-400 to-accent-500 transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className={`text-xs mt-2 ${sub()}`}>
            {xpPct >= 100 ? '🎉 Goal reached today!' : `${todayProgress.xpGoal - todayProgress.xpEarned} more XP to reach today's goal`}
          </p>
        </div>

        {/* Achievements */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${sub()}`}>Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const earned = unlocked(ach);
              return (
                <div
                  key={ach.id}
                  className={`${card('p-3.5 text-center')} transition-all
                    ${earned ? (isDark ? 'border-warn-500/40 bg-warn-500/5' : 'border-warn-400/40 bg-warn-50') : 'opacity-50'}
                  `}
                >
                  <div className={`text-3xl mb-1.5 ${earned ? '' : 'grayscale'}`}>{ach.icon}</div>
                  <p className={`text-xs font-bold ${earned ? (isDark ? 'text-warn-400' : 'text-warn-600') : sub()}`}>
                    {ach.title}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${sub()}`}>{ach.desc}</p>
                  {earned && (
                    <div className="mt-1.5 text-[9px] font-bold text-warn-400 uppercase tracking-wide">Earned ✓</div>
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
