import { useEffect, useState } from 'react';
import useAppStore from './store/useAppStore';
import ThemeProvider from './components/ThemeProvider';
import Onboarding from './pages/Onboarding';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import MobileHeader from './components/MobileHeader';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import ChatPage from './pages/ChatPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import { getSession, onAuthChange, signOut } from './services/authService';

// Auth flow:
// 1. Show AuthPage (unless already authed or skipped as guest)
// 2. Show Onboarding (if not done)
// 3. Show main app
function AppContent() {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const activePage         = useAppStore((s) => s.activePage);
  const theme              = useAppStore((s) => s.theme);
  const supabaseUser       = useAppStore((s) => s.supabaseUser);
  const setSupabaseUser    = useAppStore((s) => s.setSupabaseUser);
  const clearSupabaseUser  = useAppStore((s) => s.clearSupabaseUser);
  const resetOnboarding    = useAppStore((s) => s.resetOnboarding);

  // null = not checked yet, false = no user, object = user
  const [authChecked, setAuthChecked] = useState(false);
  const [guestMode, setGuestMode]     = useState(false);

  // Check existing session on mount
  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
      }
      setAuthChecked(true);
    });

    // Listen for auth changes
    const unsub = onAuthChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
      }
      if (event === 'SIGNED_OUT') {
        clearSupabaseUser();
        setGuestMode(false);
      }
    });
    return unsub;
  }, []);

  // Show nothing while checking session (prevents flash)
  if (!authChecked) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
        <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-xl">S</span>
        </div>
      </div>
    );
  }

  // Show Auth if not logged in and not in guest mode
  if (!supabaseUser && !guestMode) {
    return <AuthPage onSkip={() => setGuestMode(true)} />;
  }

  // Show Onboarding if not done
  if (!onboardingComplete) {
    return <Onboarding />;
  }

  const pages = {
    home:     <HomePage />,
    learn:    <LearnPage />,
    chat:     <ChatPage />,
    progress: <ProgressPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {activePage !== 'chat' && <MobileHeader />}
        <main className="flex-1 flex flex-col min-w-0">
          {pages[activePage] || <HomePage />}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
