import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, RefreshCw, Sparkles } from 'lucide-react';
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
          max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : isDark
              ? 'bg-[#161f2e] border border-[#1e2d45] text-slate-100 rounded-bl-sm'
              : 'bg-white border border-[#c7d7f8] text-slate-800 rounded-bl-sm'}
          shadow-sm
        `}
      >
        {msg.content}
        {/* TTS button for Nova's messages */}
        {!isUser && (
          <button
            onClick={() => onSpeak(msg.content)}
            className={`ml-2 inline-flex items-center opacity-40 hover:opacity-100 transition-opacity`}
          >
            <Volume2 size={12} />
          </button>
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
  "Teach me 5 new words today",
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

  // Initialize with a welcome message
  useEffect(() => {
    if (chatHistory.length === 0) {
      addMessage({
        role: 'assistant',
        content: `নমস্কার ${userProfile?.name || 'বন্ধু'}! 👋 আমি Nova — আপনার AI English tutor!\n\nআমি আপনাকে ইংরেজি শিখতে, বলতে এবং আরো দক্ষ হতে সাহায্য করবো। যেকোনো প্রশ্ন বাংলায় বা ইংরেজিতে করতে পারেন!\n\nHello! I'm Nova — let's practice English together. What would you like to work on today? 😊`,
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

    if (ttsOn) speak(reply);
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
    <div className={`flex-1 flex flex-col h-screen md:h-auto md:min-h-screen pb-16 md:pb-0 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>

      {/* Top bar */}
      <div className={`flex items-center justify-between px-4 py-3.5 border-b sticky top-0 z-10
        ${isDark ? 'bg-[#0f1623]/95 border-[#1e2d45]' : 'bg-[#f0f4ff]/95 border-[#c7d7f8]'}
        backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-600/30">
              N
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-400 border-2 border-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>Nova</p>
              {hasLiveAi() ? (
                <span className="text-[10px] bg-brand-500/15 text-brand-400 font-semibold px-2 py-0.5 rounded-full">
                  Gemini Flash ⚡
                </span>
              ) : (
                <button
                  onClick={() => {
                    const key = prompt('Enter your free Gemini API key (aistudio.google.com):');
                    if (key !== null) { setGeminiKey(key); window.location.reload(); }
                  }}
                  className="text-[10px] bg-warn-500/15 text-warn-400 hover:bg-warn-500/25 font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-all"
                  title="Click to connect free Gemini AI key"
                >
                  Offline (Tap to link AI) 🔑
                </button>
              )}
            </div>
            <p className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${hasLiveAi() ? 'bg-success-400' : 'bg-warn-400'}`} />
              {hasLiveAi() ? 'Active AI Spoken Tutor' : 'Fallback Mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTtsOn((v) => !v); if (speaking) stop(); }}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-[#161f2e] text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            {ttsOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            onClick={clearChat}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-[#161f2e] text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatHistory.map((msg, i) => (
          <Message key={i} msg={msg} theme={theme} onSpeak={speak} />
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              N
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-[#161f2e] border border-[#1e2d45]' : 'bg-white border border-[#c7d7f8]'}`}>
              <div className="flex gap-1 items-center h-4">
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

      {/* Quick prompts */}
      {chatHistory.length <= 1 && (
        <div className="px-4 pb-2">
          <p className={`text-[11px] font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Sparkles size={11} /> Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${isDark
                    ? 'border-[#1e2d45] bg-[#161f2e] text-slate-300 hover:border-brand-500/50 hover:text-brand-400'
                    : 'border-brand-200 bg-white text-slate-500 hover:border-brand-400 hover:text-brand-600'}
                `}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className={`
        px-4 py-3 border-t sticky bottom-16 md:bottom-0 z-10
        ${isDark ? 'bg-[#0f1623]/95 border-[#1e2d45]' : 'bg-[#f0f4ff]/95 border-[#c7d7f8]'}
        backdrop-blur-md
      `}>
        {/* Transcript preview */}
        {listening && transcript && (
          <div className={`mb-2 px-3 py-2 rounded-xl text-xs ${isDark ? 'bg-[#161f2e] text-slate-400' : 'bg-brand-50 text-slate-500'}`}>
            🎙️ {transcript}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <button
            onClick={toggleMic}
            className={`
              p-3 rounded-xl shrink-0 transition-all
              ${listening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : isDark ? 'bg-[#161f2e] text-slate-400 hover:text-brand-400 border border-[#1e2d45]' : 'bg-white text-slate-500 hover:text-brand-500 border border-[#c7d7f8]'}
            `}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <div className={`flex-1 flex items-end rounded-xl border overflow-hidden
            ${isDark ? 'bg-[#161f2e] border-[#1e2d45] focus-within:border-brand-500' : 'bg-white border-[#c7d7f8] focus-within:border-brand-400'}
            transition-colors`}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Type or speak in Bengali or English..."
              className={`flex-1 px-4 py-3 text-sm outline-none resize-none bg-transparent
                ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`p-3 rounded-xl shrink-0 transition-all
              ${input.trim() && !loading
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/30'
                : isDark ? 'bg-[#161f2e] text-slate-600 border border-[#1e2d45]' : 'bg-white text-slate-300 border border-[#c7d7f8]'}
            `}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
