import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { sendToGemini, hasLiveAi, setGeminiKey } from '../services/geminiService';
import { useTTS, useSTT } from '../hooks/useSpeech';

function Message({ msg, theme, onSpeak }) {
  const isDark = theme === 'dark';
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-2.5 animate-float-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-brand-600/30">
          N
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          max-w-[85%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed
          ${isUser
            ? 'bg-brand-600 text-white rounded-br-xs'
            : isDark
              ? 'bg-[#161f2e] border border-[#1e2d45] text-slate-100 rounded-bl-xs'
              : 'bg-white border border-[#c7d7f8] text-slate-800 rounded-bl-xs shadow-xs'}
        `}
      >
        <div className="whitespace-pre-wrap">{msg.content}</div>

        {/* TTS button for Nova's messages */}
        {!isUser && (
          <div className="mt-1.5 pt-1 border-t border-current/10 flex items-center justify-end">
            <button
              onClick={() => onSpeak(msg.content)}
              className="inline-flex items-center gap-1 text-[10px] font-medium opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Volume2 size={12} />
              <span>Listen</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  "আমি কীভাবে নিজেকে পরিচয় দেবো?",
  "Practice a job interview with me",
  "How do I order food in English?",
  "Correct my English sentence",
  "Teach me 3 new phrases today",
  "Talk about today's weather",
];

export default function ChatPage() {
  const theme       = useAppStore((s) => s.theme);
  const chatHistory = useAppStore((s) => s.chatHistory);
  const addMessage  = useAppStore((s) => s.addChatMessage);
  const clearChat   = useAppStore((s) => s.clearChat);
  const userProfile = useAppStore((s) => s.userProfile);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);

  const { speak, stop, speaking } = useTTS();
  const { listening, transcript, startListening, stopListening, resetTranscript } = useSTT();

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const isDark     = theme === 'dark';

  // Initialize with a welcome message if empty
  useEffect(() => {
    if (chatHistory.length === 0) {
      addMessage({
        role: 'assistant',
        content: `নমস্কার ${userProfile?.name || 'বন্ধু'}! 👋 আমি Nova — আপনার AI Spoken English Tutor!\n\nযেকোনো প্রশ্ন বাংলায় বা ইংরেজিতে করুন। দ্বিধা না করে কথা বলা শুরু করুন — ভুল হলে আমি বুঝিয়ে দেবো!\n\nHello! Ready to speak English? Tap the microphone below or send a message to get started! 😊`,
        timestamp: Date.now(),
      });
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Fill input with transcript
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg) return;

    addMessage({ role: 'user', content: msg, timestamp: Date.now() });
    setInput('');
    resetTranscript();
    setLoading(true);

    const reply = await sendToGemini(msg, chatHistory, userProfile);
    addMessage({ role: 'assistant', content: reply, timestamp: Date.now() });
    setLoading(false);

    if (ttsOn && reply) speak(reply);
  }

  function toggleMic() {
    if (listening) {
      stopListening();
    } else {
      resetTranscript();
      startListening({ lang: 'en-US' });
    }
  }

  return (
    <div className={`flex-1 flex flex-col h-[calc(100dvh-60px)] lg:h-screen overflow-hidden ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>

      {/* Top bar */}
      <div className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b shrink-0 z-10
        ${isDark ? 'bg-[#0f1623]/95 border-[#1e2d45]' : 'bg-[#f0f4ff]/95 border-[#c7d7f8]'}
        backdrop-blur-md`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-600/30">
              N
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-400 border-2 border-current" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>Nova</p>
              {hasLiveAi() ? (
                <span className="text-[10px] bg-brand-500/15 text-brand-400 font-semibold px-2 py-0.5 rounded-full shrink-0">
                  Gemini Flash ⚡
                </span>
              ) : (
                <button
                  onClick={() => {
                    const key = prompt('Enter your free Gemini API key (aistudio.google.com):');
                    if (key !== null) { setGeminiKey(key); window.location.reload(); }
                  }}
                  className="text-[10px] bg-warn-500/15 text-warn-400 hover:bg-warn-500/25 font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-all shrink-0"
                >
                  Offline (Tap to link) 🔑
                </button>
              )}
            </div>
            <p className={`text-[11px] flex items-center gap-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${hasLiveAi() ? 'bg-success-400' : 'bg-warn-400'}`} />
              {hasLiveAi() ? 'Active AI Voice Tutor' : 'Offline Fallback'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { setTtsOn((v) => !v); if (speaking) stop(); }}
            title={ttsOn ? 'Mute speech' : 'Unmute speech'}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              ttsOn
                ? isDark ? 'bg-brand-500/15 text-brand-400' : 'bg-brand-100 text-brand-600'
                : isDark ? 'text-slate-500 hover:bg-[#161f2e]' : 'text-slate-400 hover:bg-white'
            }`}
          >
            {ttsOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Clear conversation history?')) clearChat();
            }}
            title="Clear chat"
            className={`p-2 rounded-xl transition-all cursor-pointer ${isDark ? 'hover:bg-[#161f2e] text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {chatHistory.map((msg, i) => (
          <Message key={i} msg={msg} theme={theme} onSpeak={speak} />
        ))}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-2.5 animate-float-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              N
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-bl-xs ${isDark ? 'bg-[#161f2e] border border-[#1e2d45]' : 'bg-white border border-[#c7d7f8]'}`}>
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts Carousel (Scrolls horizontally, no vertical stacking) */}
      {chatHistory.length <= 2 && (
        <div className="px-3 sm:px-4 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-brand-400" />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Suggested topics
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all cursor-pointer whitespace-nowrap
                  ${isDark
                    ? 'border-[#1e2d45] bg-[#161f2e] text-slate-300 hover:border-brand-500/50 hover:text-brand-300'
                    : 'border-brand-200 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700 shadow-xs'}
                `}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className={`
        px-3 sm:px-4 py-2.5 sm:py-3 border-t shrink-0 z-10
        ${isDark ? 'bg-[#0f1623]/95 border-[#1e2d45]' : 'bg-[#f0f4ff]/95 border-[#c7d7f8]'}
        backdrop-blur-md
      `}>
        {/* Live Transcript Bubble */}
        {listening && transcript && (
          <div className={`mb-2 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 ${isDark ? 'bg-[#161f2e] text-slate-300 border border-[#1e2d45]' : 'bg-brand-50 text-slate-700 border border-brand-200'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="truncate">{transcript}</span>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Microphone Button */}
          <button
            onClick={toggleMic}
            title={listening ? 'Stop listening' : 'Start speaking'}
            className={`
              w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer
              ${listening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : isDark ? 'bg-[#161f2e] text-slate-400 hover:text-brand-400 border border-[#1e2d45]' : 'bg-white text-slate-500 hover:text-brand-600 border border-[#c7d7f8] shadow-xs'}
            `}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Text Input */}
          <div className={`flex-1 flex items-end rounded-xl border overflow-hidden min-h-[44px]
            ${isDark ? 'bg-[#161f2e] border-[#1e2d45] focus-within:border-brand-500' : 'bg-white border-[#c7d7f8] focus-within:border-brand-500 shadow-xs'}
            transition-colors`}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Type or speak in English / Bengali..."
              className={`flex-1 px-3 sm:px-4 py-2.5 text-xs sm:text-sm outline-none resize-none bg-transparent
                ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
              style={{ minHeight: '44px', maxHeight: '100px' }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer
              ${input.trim() && !loading
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/30 active:scale-95'
                : isDark ? 'bg-[#161f2e] text-slate-600 border border-[#1e2d45] cursor-not-allowed' : 'bg-white text-slate-300 border border-[#c7d7f8] cursor-not-allowed'}
            `}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
