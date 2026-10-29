import { useState } from 'react';
import { Eye, EyeOff, User, Lock, AtSign, Sparkles, ArrowRight, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signIn, signUp, cleanUsername } from '../services/authService';
import useAppStore from '../store/useAppStore';

function Input({ icon: Icon, type = 'text', placeholder, value, onChange, right, error }) {
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';
  return (
    <div>
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
        ${error
          ? 'border-red-500/60 bg-red-500/5'
          : isDark
            ? 'bg-[#252d3a] border-[#2a3f5e] focus-within:border-brand-500'
            : 'bg-brand-50 border-brand-200 focus-within:border-brand-500'}
        focus-within:ring-2 focus-within:ring-brand-500/15
      `}>
        <Icon size={16} className={isDark ? 'text-slate-500 shrink-0' : 'text-slate-400 shrink-0'} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
          className={`flex-1 text-sm outline-none bg-transparent
            ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
        />
        {right}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

export default function AuthPage({ onSkip }) {
  const theme = useAppStore((s) => s.theme);
  const setSupabaseUser = useAppStore((s) => s.setSupabaseUser);
  const setUserProfile  = useAppStore((s) => s.setUserProfile);
  const isDark = theme === 'dark';

  const [mode, setMode] = useState('choice'); // choice | login | signup
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  function f(field) {
    return (e) => {
      setForm((v) => ({ ...v, [field]: e.target.value }));
      setErrors((v) => ({ ...v, [field]: '' }));
      setGlobalError('');
    };
  }

  function validate() {
    const e = {};
    const cleaned = cleanUsername(form.username);
    if (!cleaned) e.username = 'Please enter a username (letters, numbers, _)';
    else if (cleaned.length < 3) e.username = 'Username must be at least 3 characters';

    if (!form.password || form.password.trim().length < 6) {
      e.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }

    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError('');

    if (mode === 'signup') {
      const { data, error } = await signUp({
        username: form.username,
        password: form.password,
        displayName: form.displayName || form.username,
      });

      if (error) {
        setGlobalError(error.message || 'Failed to create account. Please try another username.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccess(true);
        // Save the authenticated user in store
        setSupabaseUser(data.user);
        // Initialize userProfile with their entered name and ensure onboarding survey runs
        const initialProfile = {
          name: form.displayName || form.username,
          nativeLanguage: 'Bengali (বাংলা)',
          level: 'beginner',
        };
        useAppStore.setState({
          userProfile: initialProfile,
          onboardingComplete: false,
        });
      }
    } else {
      const { data, error } = await signIn({
        username: form.username,
        password: form.password,
      });

      if (error) {
        setGlobalError(error.message || 'Incorrect username or password. Please try again.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccess(true);
        setSupabaseUser(data.user);
        const profile = data.user.profile;
        // If user already completed onboarding previously, restore full state
        if (profile && (profile.level || profile.goal || profile.timeline)) {
          setUserProfile(profile);
        } else {
          // If onboarding wasn't completed yet, guide them to complete it
          useAppStore.setState({
            userProfile: profile || {
              name: data.user.displayName || data.user.username,
              nativeLanguage: 'Bengali (বাংলা)',
              level: 'beginner',
            },
            onboardingComplete: false,
          });
        }
      }
    }
    setLoading(false);
  }

  function bg() { return isDark ? 'bg-[#13171e]' : 'bg-[#f4f5f8]'; }
  function card(e = '') { return `${isDark ? 'bg-[#191e28] border-[#252d3a]' : 'bg-white border-[#dbe0e8]'} border rounded-2xl ${e}`; }
  function text(e = '') { return `${isDark ? 'text-white' : 'text-slate-800'} ${e}`; }
  function sub(e = '') { return `${isDark ? 'text-slate-400' : 'text-slate-500'} ${e}`; }

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-3.5 sm:px-6 py-6 overflow-y-auto transition-colors ${bg()}`}>
      <div className={`w-full max-w-sm ${card('p-5 sm:p-7')} animate-float-up my-auto shadow-xl`}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${text()}`}>SpeakFree</h1>
            <p className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
              Spoken English AI Tutor
            </p>
          </div>
        </div>

        {/* ── CHOICE ── */}
        {mode === 'choice' && (
          <div>
            <h2 className={`text-xl font-bold mb-1 ${text()}`}>Welcome! 👋</h2>
            <p className={`text-sm mb-6 ${sub()}`}>No email or phone needed — simply pick a username.</p>

            <div className="space-y-3">
              <button
                onClick={() => { setMode('signup'); setGlobalError(''); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all cursor-pointer active:scale-98"
              >
                <Sparkles size={18} />
                <span className="flex-1 text-left">Create Free Account</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => { setMode('login'); setGlobalError(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border font-semibold text-sm transition-all cursor-pointer active:scale-98
                  ${isDark ? 'border-[#252d3a] bg-[#252d3a]/50 text-white hover:border-brand-500/50' : 'border-brand-200 bg-brand-50 text-slate-700 hover:border-brand-400'}`}
              >
                <User size={18} className="text-brand-500" />
                <span className="flex-1 text-left">Sign In</span>
                <ArrowRight size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-current/10">
              <button
                onClick={onSkip}
                className={`w-full text-sm py-2 rounded-xl transition-all ${sub()} hover:text-brand-500 font-medium cursor-pointer`}
              >
                Continue as Guest
              </button>
            </div>

            <div className="mt-4 flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-success-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={10} className="text-success-500" />
              </div>
              <p className={`text-[11px] leading-relaxed ${sub()}`}>
                Your account works on any device. 100% free with unlimited spoken practice with Nova.
              </p>
            </div>
          </div>
        )}

        {/* ── SIGN UP / LOGIN FORM ── */}
        {(mode === 'signup' || mode === 'login') && (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => { setMode('choice'); setErrors({}); setGlobalError(''); }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${isDark ? 'hover:bg-[#252d3a] text-slate-400' : 'hover:bg-brand-100 text-slate-500'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className={`text-xl font-bold ${text()}`}>
                {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
            </div>

            <div className="space-y-3 mb-4">
              <Input
                icon={AtSign}
                placeholder="Username (e.g. rahul_123)"
                value={form.username}
                onChange={f('username')}
                error={errors.username}
              />

              {mode === 'signup' && (
                <Input
                  icon={User}
                  placeholder="Your Name (e.g. Rahul)"
                  value={form.displayName}
                  onChange={f('displayName')}
                  error={errors.displayName}
                />
              )}

              <Input
                icon={Lock}
                type={showPass ? 'text' : 'password'}
                placeholder="Password (min 6 characters)"
                value={form.password}
                onChange={f('password')}
                error={errors.password}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className={`cursor-pointer ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              {mode === 'signup' && (
                <Input
                  icon={Lock}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={f('confirmPassword')}
                  error={errors.confirmPassword}
                />
              )}
            </div>

            {/* Global Error Banner */}
            {globalError && (
              <div className="mb-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-left animate-float-up">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">{globalError}</p>
                </div>
                {mode === 'login' && globalError.includes('not found') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setGlobalError('');
                    }}
                    className="mt-2 text-xs font-bold text-brand-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Create '@{cleanUsername(form.username)}' account now →
                  </button>
                )}
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="mb-3 px-3 py-2.5 rounded-xl bg-success-500/10 border border-success-500/20 flex items-center gap-2 animate-float-up">
                <CheckCircle2 size={14} className="text-success-400" />
                <p className="text-xs text-success-400 font-medium">
                  {mode === 'signup' ? 'Account created! Starting your journey...' : 'Signed in! Loading your lessons...'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer
                ${loading || success
                  ? 'bg-brand-500/50 cursor-wait'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/30 active:scale-98'}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'signup' ? (
                <>
                  <Sparkles size={16} />
                  <span>Create Account & Start Learning</span>
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <p className={`text-center text-xs mt-4 ${sub()}`}>
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setErrors({});
                  setGlobalError('');
                }}
                className="text-brand-500 font-semibold hover:underline cursor-pointer"
              >
                {mode === 'signup' ? 'Sign In' : 'Sign Up Free'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
