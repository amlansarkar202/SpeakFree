import { Sun, Moon, Key, Bell, Globe, ChevronRight, Info, Heart, Shield, RotateCcw, LogOut, Cloud, CloudOff } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { LEVELS, TIMELINES } from '../data/curriculum';
import { signOut } from '../services/authService';

function SettingRow({ icon: Icon, label, labelBn, action, isDark }) {
  return (
    <button
      onClick={action}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all
        ${isDark ? 'bg-[#161f2e] border-[#1e2d45] hover:border-brand-500/40' : 'bg-white border-[#c7d7f8] hover:border-brand-300'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-50'}`}>
        <Icon size={17} className={isDark ? 'text-brand-400' : 'text-brand-600'} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{label}</p>
        {labelBn && <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{labelBn}</p>}
      </div>
      <ChevronRight size={16} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
    </button>
  );
}

export default function SettingsPage() {
  const theme            = useAppStore((s) => s.theme);
  const toggleTheme      = useAppStore((s) => s.toggleTheme);
  const userProfile      = useAppStore((s) => s.userProfile);
  const resetOnboarding  = useAppStore((s) => s.resetOnboarding);
  const supabaseUser     = useAppStore((s) => s.supabaseUser);
  const clearSupabaseUser = useAppStore((s) => s.clearSupabaseUser);
  const isDark           = theme === 'dark';

  const username = supabaseUser?.user_metadata?.username || supabaseUser?.email?.split('@')[0] || null;

  const levelObj    = LEVELS.find((l) => l.id === userProfile?.level);
  const timelineObj = TIMELINES.find((t) => t.id === userProfile?.timeline);

  async function handleSignOut() {
    if (window.confirm('Sign out of your account?')) {
      await signOut();
      clearSupabaseUser();
      window.location.reload();
    }
  }

  // Save API key to localStorage
  function handleApiKey() {
    const current = localStorage.getItem('VITE_GEMINI_API_KEY') || '';
    const key = prompt(
      'Enter your Gemini API Key (free at aistudio.google.com):\nLeave blank to use offline mode.',
      current
    );
    if (key !== null) {
      localStorage.setItem('VITE_GEMINI_API_KEY', key);
      window.location.reload();
    }
  }

  function section(title) {
    return (
      <p className={`text-[11px] font-semibold uppercase tracking-widest mb-2 mt-1 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {title}
      </p>
    );
  }

  return (
    <div className={`flex-1 min-h-screen pb-20 md:pb-0 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Settings</h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>সেটিংস ও পছন্দসমূহ</p>
        </div>

        {/* Account card */}
        {supabaseUser ? (
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8]'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow shadow-brand-600/20">
                {(supabaseUser.user_metadata?.display_name || username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {supabaseUser.user_metadata?.display_name || username}
                </p>
                <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-success-400' : 'text-success-600'}`}>
                  <Cloud size={11} /> @{username} · Synced
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                  ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
            {userProfile && (
              <div className={`grid grid-cols-2 gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-50'}`}>
                  <p className="font-medium">Level</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{levelObj?.emoji} {levelObj?.label || '—'}</p>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-50'}`}>
                  <p className="font-medium">Daily Goal</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{timelineObj?.label || '—'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8]'} flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-50'}`}>
              <CloudOff size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Guest Mode</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Progress saved locally only</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold text-brand-500 hover:text-brand-400"
            >
              Sign Up →
            </button>
          </div>
        )}

        {/* Appearance */}
        {section('Appearance')}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all
            ${isDark ? 'bg-[#161f2e] border-[#1e2d45] hover:border-brand-500/40' : 'bg-white border-[#c7d7f8] hover:border-brand-300'}`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1e2d45]' : 'bg-brand-50'}`}>
            {isDark ? <Sun size={17} className="text-warn-400" /> : <Moon size={17} className="text-brand-600" />}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </p>
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDark ? 'হালকা রঙের থিম' : 'অন্ধকার থিম'}
            </p>
          </div>
          <div className={`
            w-11 h-6 rounded-full relative transition-all
            ${isDark ? 'bg-brand-600' : 'bg-slate-200'}
          `}>
            <div className={`
              w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-all
              ${isDark ? 'left-6' : 'left-1'}
            `} />
          </div>
        </button>

        {/* AI Settings */}
        {section('AI & Features')}
        <div className="space-y-2">
          <SettingRow
            icon={Key} isDark={isDark}
            label="Gemini API Key"
            labelBn="বিনামূল্যে AI ব্যবহার করুন"
            action={handleApiKey}
          />
          <SettingRow
            icon={Globe} isDark={isDark}
            label="Interface Language"
            labelBn="Bengali / English (coming soon)"
            action={() => alert('More languages coming soon!')}
          />
          <SettingRow
            icon={Bell} isDark={isDark}
            label="Daily Reminders"
            labelBn="প্রতিদিনের অনুস্মারক (coming soon)"
            action={() => alert('Push notifications coming in next update!')}
          />
        </div>

        {/* Account */}
        {section('Account')}
        <div className="space-y-2">
          <SettingRow
            icon={RotateCcw} isDark={isDark}
            label="Restart Onboarding"
            labelBn="নতুনভাবে শুরু করুন"
            action={resetOnboarding}
          />
        </div>

        {/* About */}
        {section('About')}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8]'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <div>
              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>SpeakFree</p>
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Alpha v0.1 · 100% Free Forever</p>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            SpeakFree is a free, open AI-powered English fluency trainer for Bengali speakers.
            Built with ❤️ — no subscriptions, no paywalls, ever.
          </p>
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-[#1e2d45]' : 'border-brand-100'} flex items-center gap-1`}>
            <Heart size={11} className="text-red-400" />
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Powered by Google Gemini AI · Web Speech API
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
