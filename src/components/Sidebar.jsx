import { Home, BookOpen, MessageCircle, BarChart2, Settings, LogOut, Zap, Target } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const NAV_ITEMS = [
  { id: 'home',     icon: Home,          label: 'Home' },
  { id: 'learn',    icon: BookOpen,       label: 'Learn' },
  { id: 'chat',     icon: MessageCircle,  label: 'AI Tutor' },
  { id: 'progress', icon: BarChart2,      label: 'Progress' },
  { id: 'settings', icon: Settings,       label: 'Settings' },
];

export default function Sidebar({ onNav }) {
  const activePage    = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const userProfile   = useAppStore((s) => s.userProfile);
  const todayProgress = useAppStore((s) => s.todayProgress);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const theme         = useAppStore((s) => s.theme);

  const xpPct = Math.min(100, Math.round((todayProgress.xpEarned / todayProgress.xpGoal) * 100));

  const handleNav = (id) => {
    setActivePage(id);
    onNav?.(id);
  };

  return (
    <aside className={`
      hidden lg:flex flex-col h-screen w-64 shrink-0 sticky top-0
      ${theme === 'dark'
        ? 'bg-[#111827] border-r border-[#1e2d45]'
        : 'bg-[#e8eeff] border-r border-[#c7d7f8]'}
      transition-colors duration-200
    `}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              SpeakFree
            </h1>
            <p className={`text-[10px] font-medium tracking-wide uppercase ${theme === 'dark' ? 'text-brand-400' : 'text-brand-600'}`}>
              AI English Tutor
            </p>
          </div>
        </div>
      </div>

      {/* User card */}
      {userProfile && (
        <div className={`mx-3 mb-4 p-3 rounded-2xl ${theme === 'dark' ? 'bg-[#161f2e]' : 'bg-white/70'}`}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {userProfile.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {userProfile.name}
              </p>
              <p className={`text-[11px] capitalize ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {userProfile.level} · 🔥 {todayProgress.streak}d streak
              </p>
            </div>
          </div>
          {/* Daily XP bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] font-medium flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <Zap size={10} className="text-warn-400" /> Daily XP
              </span>
              <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-warn-400' : 'text-warn-500'}`}>
                {todayProgress.xpEarned}/{todayProgress.xpGoal}
              </span>
            </div>
            <div className={`h-1.5 rounded-full ${theme === 'dark' ? 'bg-[#1e2d45]' : 'bg-brand-100'}`}>
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-warn-400 to-accent-500 transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : theme === 'dark'
                    ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                    : 'text-slate-500 hover:bg-brand-100 hover:text-brand-700'
                }
              `}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
              {id === 'chat' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Daily Goal widget */}
      <div className={`mx-3 mb-3 p-3 rounded-2xl ${theme === 'dark' ? 'bg-[#161f2e]' : 'bg-white/70'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Target size={14} className="text-success-500" />
          <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
            Today's Goal
          </span>
        </div>
        <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {todayProgress.lessonsCompleted} lessons · {todayProgress.practiceMinutes || 0} min
        </p>
        <div className="mt-2 flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < todayProgress.lessonsCompleted
                  ? 'bg-success-500'
                  : theme === 'dark' ? 'bg-[#1e2d45]' : 'bg-brand-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Reset / logout */}
      <div className="px-3 pb-5">
        <button
          onClick={resetOnboarding}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${theme === 'dark'
              ? 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
        >
          <LogOut size={16} />
          Switch Profile
        </button>
      </div>
    </aside>
  );
}
