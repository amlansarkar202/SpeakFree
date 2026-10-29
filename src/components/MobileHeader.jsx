import { Flame, Sun, Moon, Sparkles } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { hasLiveAi } from '../services/geminiService';

export default function MobileHeader() {
  const theme         = useAppStore((s) => s.theme);
  const toggleTheme   = useAppStore((s) => s.toggleTheme);
  const todayProgress = useAppStore((s) => s.todayProgress);
  const userProfile   = useAppStore((s) => s.userProfile);
  const isDark        = theme === 'dark';

  return (
    <header className={`
      lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md transition-colors
      ${isDark ? 'bg-[#13171e]/95 border-[#252d3a]' : 'bg-[#f4f5f8]/95 border-[#dbe0e8]'}
    `}>
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-600/30">
          S
        </div>
        <div>
          <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            SpeakFree
          </span>
          <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-brand-500/15 text-brand-400' : 'bg-brand-100 text-brand-600'}`}>
            {userProfile?.level ? userProfile.level : 'Bilingual'}
          </span>
        </div>
      </div>

      {/* Right actions: Streak + Theme toggle */}
      <div className="flex items-center gap-2">
        {/* Streak chip */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
          isDark ? 'bg-[#191e28] border border-[#252d3a] text-accent-400' : 'bg-white border border-[#dbe0e8] text-accent-500 shadow-sm'
        }`}>
          <Flame size={13} className="fill-accent-400" />
          <span>{todayProgress.streak}d</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`p-2 rounded-xl border transition-all ${
            isDark
              ? 'bg-[#191e28] border-[#252d3a] text-slate-300 hover:text-white'
              : 'bg-white border-[#dbe0e8] text-slate-600 hover:text-slate-900 shadow-sm'
          }`}
        >
          {isDark ? <Sun size={15} className="text-warn-400" /> : <Moon size={15} className="text-brand-600" />}
        </button>
      </div>
    </header>
  );
}
