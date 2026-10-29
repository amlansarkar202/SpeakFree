// SpeakFree High-Reliability Dual-Layer Auth Engine (Cloud + Local Cache)
// Ensures username + password signup & signin syncs flawlessly across all devices

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

  const initialProfile = {
    name: name || clean,
    nativeLanguage: 'Bengali (বাংলা)',
    level: 'beginner',
  };

  const localUserObj = {
    id: 'user_' + clean + '_' + Date.now(),
    username: clean,
    displayName: name,
    password: pass,
    profile: initialProfile,
    created_at: new Date().toISOString(),
    user_metadata: {
      username: clean,
      display_name: name,
    },
  };

  // Try cloud registration with automatic 1-retry fallback
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch('/api/auth?action=signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clean,
          password: pass,
          displayName: name,
          profile: initialProfile,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.user) {
        // Cache in local storage for instant offline access
        const accounts = getLocalAccounts();
        accounts[clean] = { ...data.user, password: pass };
        saveLocalAccounts(accounts);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.user));
        return { data: { user: data.user, session: { user: data.user } }, error: null };
      }

      if (res.status === 409) {
        return { error: { message: data.error || 'This username is already taken. Try another!' } };
      }
      if (res.status === 400) {
        return { error: { message: data.error || 'Invalid username or password' } };
      }
      lastError = data.error;
    } catch (err) {
      lastError = err.message;
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  // If cloud server is completely unreachable, inform the user clearly
  console.warn('Cloud signup failed after attempts:', lastError);
  return {
    error: {
      message: 'Unable to reach cloud authentication service. Please check your internet connection and try again.',
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

  // 1. Try cloud sign-in first (enables cross-device access)
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
      return { data: { user: data.user, session: { user: data.user } }, error: null };
    }

    if (res.status === 401) {
      return { error: { message: 'Incorrect password. Please try again.' } };
    }

    if (res.status === 404) {
      // Check if local cache on this device has this account
      const accounts = getLocalAccounts();
      const localUser = accounts[clean];
      if (localUser && localUser.password === pass) {
        // Self-heal: push local account to cloud so it works on other devices from now on!
        fetch('/api/auth?action=signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: clean,
            password: pass,
            displayName: localUser.displayName || clean,
            profile: localUser.profile,
          }),
        }).catch(() => {});

        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUser));
        return { data: { user: localUser, session: { user: localUser } }, error: null };
      }
      return { error: { message: `Account '@${clean}' not found. Please check spelling or create a new account.` } };
    }
  } catch (cloudErr) {
    console.warn('Cloud signin network error, checking local device cache:', cloudErr);
  }

  // 2. Offline device cache fallback if internet drops
  const accounts = getLocalAccounts();
  const localUser = accounts[clean];
  if (localUser) {
    if (localUser.password !== pass) {
      return { error: { message: 'Incorrect password. Please try again.' } };
    }
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUser));
    return { data: { user: localUser, session: { user: localUser } }, error: null };
  }

  return {
    error: {
      message: `Account '@${clean}' not found. Please check your internet connection or create a free account.`,
    },
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
  let user = Object.values(accounts).find((u) => u.id === userId);

  if (!user) {
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY);
      if (raw) user = JSON.parse(raw);
    } catch {}
  }

  if (user) {
    user.profile = { ...(user.profile || {}), ...updates };
    if (updates.name) {
      user.displayName = updates.name;
      if (user.user_metadata) user.user_metadata.display_name = updates.name;
    }
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
  let user = Object.values(accounts).find((u) => u.id === userId);

  if (!user) {
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY);
      if (raw) user = JSON.parse(raw);
    } catch {}
  }

  if (user) {
    user.progress = { ...(user.progress || {}), ...progress };
    accounts[user.username] = user;
    saveLocalAccounts(accounts);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));

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
  let user = Object.values(accounts).find((u) => u.id === userId);
  if (!user) {
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY);
      if (raw) user = JSON.parse(raw);
    } catch {}
  }
  return user?.profile || null;
}

