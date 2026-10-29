import { useState } from 'react';
import { Eye, EyeOff, User, Lock, AtSign, Sparkles, ArrowRight, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signIn, signUp } from '../services/authService';
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
            ? 'bg-[#1e2d45] border-[#2a3f5e] focus-within:border-brand-500'
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
    if (!form.username.trim()) e.username = 'Username is required';
    else if (form.username.length < 3) e.username = 'Minimum 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Only letters, numbers and _';

    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';

    if (mode === 'signup' && form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';

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
        setGlobalError(
          error.message.includes('already registered')
            ? 'This username is already taken. Try another!'
            : error.message
        );
      } else {
        setSuccess(true);
        if (data?.user) setSupabaseUser(data.user);
        setTimeout(onSkip, 1500);
      }
    } else {
      const { data, error } = await signIn({
        username: form.username,
        password: form.password,
      });
      if (error) {
        setGlobalError('Wrong username or password. Please try again.');
      } else {
        setSuccess(true);
        if (data?.user) setSupabaseUser(data.user);
        setTimeout(onSkip, 1000);
      }
    }
    setLoading(false);
  }

  function bg() { return isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'; }
  function card(e = '') { return `${isDark ? 'bg-[#161f2e] border-[#1e2d45]' : 'bg-white border-[#c7d7f8]'} border rounded-2xl ${e}`; }
  function text(e = '') { return `${isDark ? 'text-white' : 'text-slate-800'} ${e}`; }
  function sub(e = '') { return `${isDark ? 'text-slate-400' : 'text-slate-500'} ${e}`; }

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-3.5 sm:px-6 py-6 overflow-y-auto transition-colors ${bg()}`}>
      <div className={`w-full max-w-sm ${card('p-5 sm:p-7')} animate-float-up my-auto`}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${text()}`}>SpeakFree</h1>
            <p className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
              AI English Tutor
            </p>
          </div>
        </div>

        {/* ── CHOICE ── */}
        {mode === 'choice' && (
          <div>
            <h2 className={`text-xl font-bold mb-1 ${text()}`}>Welcome! 👋</h2>
            <p className={`text-sm mb-6 ${sub()}`}>No email or phone needed — just pick a username.</p>

            <div className="space-y-3">
              <button
                onClick={() => setMode('signup')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all"
              >
                <Sparkles size={18} />
                <span className="flex-1 text-left">Create Free Account</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setMode('login')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border font-semibold text-sm transition-all
                  ${isDark ? 'border-[#1e2d45] bg-[#1e2d45]/50 text-white hover:border-brand-500/50' : 'border-brand-200 bg-brand-50 text-slate-700 hover:border-brand-400'}`}
              >
                <User size={18} className="text-brand-500" />
                <span className="flex-1 text-left">Sign In</span>
                <ArrowRight size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-current/10">
              <button
                onClick={onSkip}
                className={`w-full text-sm py-2 rounded-xl transition-all ${sub()} hover:text-brand-500 font-medium`}
              >
                Continue as Guest (no sync)
              </button>
            </div>

            <div className="mt-4 flex items-start gap-2">
              <div className={`w-4 h-4 rounded-full bg-success-500/20 flex items-center justify-center shrink-0 mt-0.5`}>
                <CheckCircle2 size={10} className="text-success-500" />
              </div>
              <p className={`text-[11px] leading-relaxed ${sub()}`}>
                Your account syncs progress across devices. No email, no phone — just a username and password.
              </p>
            </div>
          </div>
        )}

        {/* ── SIGN UP / LOGIN ── */}
        {(mode === 'signup' || mode === 'login') && (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-5">
              <button type="button" onClick={() => { setMode('choice'); setErrors({}); setGlobalError(''); }}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-[#1e2d45] text-slate-400' : 'hover:bg-brand-100 text-slate-500'}`}>
                <ChevronLeft size={18} />
              </button>
              <h2 className={`text-xl font-bold ${text()}`}>
                {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
            </div>

            <div className="space-y-3 mb-4">
              <Input
                icon={AtSign}
                placeholder="Username (e.g. amlan_123)"
                value={form.username}
                onChange={f('username')}
                error={errors.username}
              />

              {mode === 'signup' && (
                <Input
                  icon={User}
                  placeholder="Display name (e.g. Amlan)"
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
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className={isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}>
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

            {/* Global error */}
            {globalError && (
              <div className="mb-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{globalError}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-3 px-3 py-2.5 rounded-xl bg-success-500/10 border border-success-500/20 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-success-400" />
                <p className="text-xs text-success-400">
                  {mode === 'signup' ? 'Account created! Setting up your profile...' : 'Signed in! Loading your progress...'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${loading || success
                  ? 'bg-brand-500/50 cursor-wait'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/30'}`}
            >
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Processing...</>
                : mode === 'signup'
                  ? <><Sparkles size={16} /> Create My Account</>
                  : <><ArrowRight size={16} /> Sign In</>
              }
            </button>

            <p className={`text-center text-xs mt-4 ${sub()}`}>
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErrors({}); setGlobalError(''); }}
                className="text-brand-500 font-semibold hover:underline"
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
