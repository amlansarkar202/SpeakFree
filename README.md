# SpeakFree — AI English Tutor for Bengali Speakers

## Setup

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Get a FREE Gemini API key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Create a free API key (generous free tier)
   - The app works in **offline fallback mode** even without a key

3. **Add your API key (optional but recommended):**
   - Open the app → Settings → Gemini API Key
   - Paste your key there

4. **Run locally:**
   ```
   npm run dev
   ```
   Then open: http://localhost:5173

## Features (Alpha v0.1)

- 🎯 **Smart Onboarding** — Name, goal, assessment quiz, level selection, daily timeline
- 📚 **Structured Curriculum** — Bengali-to-English lessons for Beginner/Intermediate/Advanced
- 🤖 **Nova AI Tutor** — Chat in Bengali or English, get corrections and encouragement
- 🎙️ **Voice Practice** — Speak answers using browser mic, get AI feedback
- 🔊 **Text-to-Speech** — Hear correct pronunciation of every word and phrase
- 📈 **Progress Tracking** — XP, streaks, achievements, course completion ring
- 🌙 **Dark/Light Theme** — Beautiful blue-tinted dark and light modes
- 📱 **Mobile-Ready** — Works perfectly on phone browsers (bottom nav)

## Architecture

```
src/
├── store/       → Zustand state (persisted to localStorage)
├── services/    → Gemini AI integration
├── hooks/       → Web Speech API (STT + TTS)
├── data/        → Curriculum & syllabus data
├── pages/       → Home, Learn, Chat, Progress, Settings
└── components/  → Sidebar, BottomNav, LessonView, ThemeProvider
```

## Coming Next

- [ ] Push notifications / reminders
- [ ] Speaking speed tracker (WPM)
- [ ] Filler word counter ("um", "uh" detection)
- [ ] More languages (Hindi, Tamil, etc.)
- [ ] Offline PWA mode
- [ ] User accounts & cloud sync
