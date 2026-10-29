import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Theme ──────────────────────────────────────────────────────────
      theme: 'dark',
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // ── Supabase Auth User ──────────────────────────────────────────────
      supabaseUser: null,
      setSupabaseUser: (user) => set({ supabaseUser: user }),
      clearSupabaseUser: () => set({ supabaseUser: null }),

      // ── Onboarding ─────────────────────────────────────────────────────
      onboardingComplete: false,
      userProfile: null, // { name, nativeLanguage, learningGoal, level, timeline, dailyMinutes }
      setUserProfile: (profile) =>
        set({ userProfile: profile, onboardingComplete: true }),
      resetOnboarding: () =>
        set({ onboardingComplete: false, userProfile: null }),

      // ── Daily Progress ─────────────────────────────────────────────────
      todayProgress: {
        xpEarned: 0,
        xpGoal: 50,
        lessonsCompleted: 0,
        practiceMinutes: 0,
        streak: 0,
        lastActiveDate: null,
      },
      addXP: (amount) =>
        set((s) => ({
          todayProgress: {
            ...s.todayProgress,
            xpEarned: s.todayProgress.xpEarned + amount,
          },
        })),
      completedLesson: (xp = 10) => {
        const today = new Date().toDateString();
        set((s) => {
          const last = s.todayProgress.lastActiveDate;
          const isNewDay = last !== today;
          const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
          const streak = isNewDay
            ? last === yesterdayStr
              ? s.todayProgress.streak + 1
              : 1
            : s.todayProgress.streak;
          return {
            todayProgress: {
              ...s.todayProgress,
              xpEarned: s.todayProgress.xpEarned + xp,
              lessonsCompleted: s.todayProgress.lessonsCompleted + 1,
              streak,
              lastActiveDate: today,
            },
          };
        });
      },

      // ── Course Progress ────────────────────────────────────────────────
      completedLessons: [],
      markLessonDone: (lessonId) =>
        set((s) => ({
          completedLessons: s.completedLessons.includes(lessonId)
            ? s.completedLessons
            : [...s.completedLessons, lessonId],
        })),

      // ── Active Chat history ─────────────────────────────────────────────
      chatHistory: [],
      addChatMessage: (msg) =>
        set((s) => ({
          chatHistory: [...s.chatHistory.slice(-50), msg], // keep last 50
        })),
      clearChat: () => set({ chatHistory: [] }),

      // ── Active page ─────────────────────────────────────────────────────
      activePage: 'home',
      setActivePage: (page) => set({ activePage: page }),
    }),
    {
      name: 'speakfree-store',
      partialize: (s) => ({
        theme: s.theme,
        onboardingComplete: s.onboardingComplete,
        userProfile: s.userProfile,
        todayProgress: s.todayProgress,
        completedLessons: s.completedLessons,
      }),
    }
  )
);

export default useAppStore;
