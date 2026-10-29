// SpeakFree High-Reliability Dual-Layer Auth Engine (Cloud + Local Cache)
// Allows instant username + password signup & signin that syncs across devices

const LOCAL_USERS_KEY = 'speakfree_local_accounts';
const LOCAL_SESSION_KEY = 'speakfree_active_session';

export function cleanUsername(username) {
  return (username || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '');
}

function getLocalAccounts() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
  } catch {}
}

// ── SIGN UP ────────────────────────────────────────────────────────────────
export async function signUp({ username, password, displayName }) {
  const clean = cleanUsername(username);
  const pass = (password || '').trim();
  const name = (displayName || clean).trim();

  if (clean.length < 3) {
    return { error: { message: 'Username must be at least 3 characters (letters, numbers, _)' } };
  }
  if (!pass || pass.length < 6) {
    return { error: { message: 'Password must be at least 6 characters' } };
  }

  const defaultProfile = {
    name: name || clean,
    nativeLanguage: 'Bengali (বাংলা)',
    level: 'beginner',
    learningGoal: 'Confident Daily English Speaking',
    timeline: '30',
    xpGoal: 50,
  };

  const newUser = {
    id: 'user_' + clean + '_' + Date.now(),
    username: clean,
    displayName: name,
    password: pass,
    profile: defaultProfile,
    created_at: new Date().toISOString(),
    user_metadata: {
      username: clean,
      display_name: name,
    },
  };

  // 1. Try cloud registration via serverless /api/auth
  try {
    const res = await fetch('/api/auth?action=signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: clean,
        password: pass,
        displayName: name,
        profile: defaultProfile,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: { message: data.error || 'Signup failed' } };
    }

    if (data?.user) {
      // Cache in local storage for instant offline access
      const accounts = getLocalAccounts();
      accounts[clean] = { ...data.user, password: pass };
      saveLocalAccounts(accounts);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.user));
      return { data: { user: data.user } };
    }
  } catch (cloudErr) {
    console.warn('Cloud signup failed, using local offline account:', cloudErr);
  }

  // 2. Offline / local fallback
  const accounts = getLocalAccounts();
  if (accounts[clean]) {
    return { error: { message: 'This username is already taken. Try another!' } };
  }

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
  const clean = cleanUsername(username);
  const pass = (password || '').trim();

  if (!clean) {
    return { error: { message: 'Please enter your username' } };
  }
  if (!pass) {
    return { error: { message: 'Please enter your password' } };
  }

  // 1. Try cloud sign-in via /api/auth (cross-device support)
  try {
    const res = await fetch('/api/auth?action=signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clean, password: pass }),
    });

    const data = await res.json();
    if (res.ok && data?.user) {
      // Cache locally
      const accounts = getLocalAccounts();
      accounts[clean] = { ...data.user, password: pass };
      saveLocalAccounts(accounts);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.user));
      return { data: { user: data.user }, error: null };
    }

    if (res.status === 401 || res.status === 404) {
      // Check if local cache has it with same password
      const accounts = getLocalAccounts();
      const localUser = accounts[clean];
      if (localUser && localUser.password === pass) {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUser));
        return { data: { user: localUser }, error: null };
      }
      return { error: { message: data.error || 'Incorrect username or password' } };
    }
  } catch (cloudErr) {
    console.warn('Cloud signin failed, checking local accounts:', cloudErr);
  }

  // 2. Local account storage fallback
  const accounts = getLocalAccounts();
  const user = accounts[clean];

  if (!user) {
    return {
      error: {
        message: `Account '@${clean}' not found on this device. Please create an account or verify your spelling.`,
      },
    };
  }

  if (user.password !== pass) {
    return { error: { message: 'Incorrect password. Please try again.' } };
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
}

// ── GET CURRENT ACTIVE SESSION ─────────────────────────────────────────────
export async function getSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      return { user };
    }
  } catch (err) {
    console.warn('Error reading local session:', err);
  }
  return null;
}

// ── PROFILE & PROGRESS SYNC ────────────────────────────────────────────────
export async function updateProfile(userId, updates) {
  const accounts = getLocalAccounts();
  const user = Object.values(accounts).find((u) => u.id === userId);
  if (user) {
    user.profile = { ...(user.profile || {}), ...updates };
    accounts[user.username] = user;
    saveLocalAccounts(accounts);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));

    // Sync to cloud in background
    try {
      fetch('/api/auth?action=sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, profile: user.profile }),
      }).catch(() => {});
    } catch {}

    return { data: user, error: null };
  }
  return { data: null, error: { message: 'User not found' } };
}

export async function saveProgress(userId, progress) {
  const accounts = getLocalAccounts();
  const user = Object.values(accounts).find((u) => u.id === userId);
  if (user) {
    user.progress = { ...(user.progress || {}), ...progress };
    accounts[user.username] = user;
    saveLocalAccounts(accounts);

    try {
      fetch('/api/auth?action=sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, progress: user.progress }),
      }).catch(() => {});
    } catch {}
  }
}

export function onAuthChange(callback) {
  return () => {};
}

export async function getProfile(userId) {
  const accounts = getLocalAccounts();
  const user = Object.values(accounts).find((u) => u.id === userId);
  return user?.profile || null;
}
