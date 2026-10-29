import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || '';

// Supabase client — singleton
export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

// Internal email generator — username-only auth trick
// Users never see or need this email
function toEmail(username) {
  return `${username.toLowerCase().trim()}@speakfree.app`;
}

// ── SIGN UP ────────────────────────────────────────────────────────────────
export async function signUp({ username, password, displayName }) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };

  // 1. Validate username
  const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (clean.length < 3) return { error: { message: 'Username must be at least 3 characters (letters, numbers, _)' } };

  // 2. Create auth user
  const { data, error } = await supabase.auth.signUp({
    email: toEmail(clean),
    password,
    options: {
      data: { username: clean, display_name: displayName || clean },
      emailRedirectTo: undefined,
    },
  });
  if (error) return { error };

  // 3. Upsert profile row
  if (data?.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      username: clean,
      display_name: displayName || clean,
      created_at: new Date().toISOString(),
    });
  }

  return { data };
}

// ── SIGN IN ────────────────────────────────────────────────────────────────
export async function signIn({ username, password }) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };

  const clean = username.toLowerCase().trim();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(clean),
    password,
  });
  return { data, error };
}

// ── SIGN OUT ───────────────────────────────────────────────────────────────
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

// ── GET SESSION ────────────────────────────────────────────────────────────
export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

// ── GET PROFILE ────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────
export async function updateProfile(userId, updates) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ── SAVE PROGRESS (cloud sync) ─────────────────────────────────────────────
export async function saveProgress(userId, progress) {
  if (!supabase) return;
  await supabase.from('user_progress').upsert({
    user_id: userId,
    ...progress,
    updated_at: new Date().toISOString(),
  });
}

// ── LOAD PROGRESS ──────────────────────────────────────────────────────────
export async function loadProgress(userId) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

// ── AUTH STATE CHANGE LISTENER ─────────────────────────────────────────────
export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
