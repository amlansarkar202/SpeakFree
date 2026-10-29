import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || '';

// Check if a real Supabase instance is configured (not dummy template string)
const isRealSupabase =
  Boolean(SUPABASE_URL &&
  SUPABASE_ANON &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON.includes('your_supabase_anon_key'));

export const supabase = isRealSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

function toEmail(username) {
  return `${username.toLowerCase().trim()}@speakfree.app`;
}

// ── LOCAL STORAGE AUTH FALLBACK ──────────────────────────────────────────
// Allows instant username + password accounts without requiring a cloud DB setup
const LOCAL_USERS_KEY = 'speakfree_local_accounts';
const LOCAL_SESSION_KEY = 'speakfree_active_session';

function getLocalAccounts() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
}

// ── SIGN UP ────────────────────────────────────────────────────────────────
export async function signUp({ username, password, displayName }) {
  const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (clean.length < 3) {
    return { error: { message: 'Username must be at least 3 characters (letters, numbers, _)' } };
  }
  if (!password || password.length < 6) {
    return { error: { message: 'Password must be at least 6 characters' } };
  }

  // 1. If Supabase is configured, use cloud auth
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: toEmail(clean),
        password,
        options: {
          data: { username: clean, display_name: displayName || clean },
          emailRedirectTo: undefined,
        },
      });
      if (error) return { error };

      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: clean,
          display_name: displayName || clean,
          created_at: new Date().toISOString(),
        });
      }
      return { data };
    } catch (err) {
      console.warn('Supabase signup failed, falling back to local account:', err);
    }
  }

  // 2. Local account storage fallback
  const accounts = getLocalAccounts();
  if (accounts[clean]) {
    return { error: { message: 'This username is already taken. Try another!' } };
  }

  const newUser = {
    id: 'user_' + clean + '_' + Date.now(),
    username: clean,
    displayName: displayName || clean,
    password: password, // In client fallback, stored in localStorage
    created_at: new Date().toISOString(),
    user_metadata: {
      username: clean,
      display_name: displayName || clean,
    },
  };

  accounts[clean] = newUser;
  saveLocalAccounts(accounts);
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newUser));

  return {
    data: {
      user: newUser,
      session: { user: newUser },
    },
  };
}

// ── SIGN IN ────────────────────────────────────────────────────────────────
export async function signIn({ username, password }) {
  const clean = username.toLowerCase().trim();

  // 1. If Supabase is configured, use cloud auth
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: toEmail(clean),
        password,
      });
      if (!error && data?.user) return { data, error: null };
      if (error && !error.message.includes('fetch')) return { data: null, error };
    } catch (err) {
      console.warn('Supabase signin failed, falling back to local account:', err);
    }
  }

  // 2. Local account storage fallback
  const accounts = getLocalAccounts();
  const user = accounts[clean];

  if (!user || user.password !== password) {
    return { error: { message: 'Incorrect username or password. Please try again.' } };
  }

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  return {
    data: {
      user,
      session: { user },
    },
    error: null,
  };
}

// ── SIGN OUT ───────────────────────────────────────────────────────────────
export async function signOut() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout warning:', err);
    }
  }
}

// ── GET SESSION ────────────────────────────────────────────────────────────
export async function getSession() {
  // Check local session first
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      return { user };
    }
  } catch (err) {
    console.warn('Error reading local session:', err);
  }

  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

// ── PROFILE & CLOUD PROGRESS SYNC ──────────────────────────────────────────
export async function getProfile(userId) {
  if (supabase) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) return data;
    } catch {}
  }
  const accounts = getLocalAccounts();
  return Object.values(accounts).find((u) => u.id === userId) || null;
}

export async function updateProfile(userId, updates) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (data) return { data, error };
    } catch {}
  }

  const accounts = getLocalAccounts();
  const user = Object.values(accounts).find((u) => u.id === userId);
  if (user) {
    Object.assign(user, updates);
    accounts[user.username] = user;
    saveLocalAccounts(accounts);
    return { data: user, error: null };
  }
  return { data: null, error: { message: 'User not found' } };
}

export async function saveProgress(userId, progress) {
  if (supabase) {
    try {
      await supabase.from('user_progress').upsert({
        user_id: userId,
        ...progress,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  }
}

export async function loadProgress(userId) {
  if (supabase) {
    try {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) return data;
    } catch {}
  }
  return null;
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  } catch {
    return () => {};
  }
}
