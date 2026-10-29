// SpeakFree Universal Cloud Account Engine
// Enables free, cross-device username + password accounts across mobile, tablet, and desktop

const MASTER_STORE_ID = 'ff808181a09d98f701a188da530a561b';
const REST_URL = `https://api.restful-api.dev/objects/${MASTER_STORE_ID}`;

// In-memory cache for fast lambdas
let memoryAccounts = null;
let lastFetch = 0;

async function fetchCloudAccounts() {
  const now = Date.now();
  if (memoryAccounts && now - lastFetch < 5000) {
    return memoryAccounts;
  }
  try {
    const res = await fetch(REST_URL);
    if (res.ok) {
      const doc = await res.json();
      memoryAccounts = doc?.data?.accounts || {};
      lastFetch = now;
      return memoryAccounts;
    }
  } catch (err) {
    console.error('Failed to fetch cloud accounts:', err);
  }
  return memoryAccounts || {};
}

async function saveCloudAccounts(accounts) {
  memoryAccounts = accounts;
  lastFetch = Date.now();
  try {
    await fetch(REST_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'speakfree_accounts_store_v1',
        data: { accounts },
      }),
    });
  } catch (err) {
    console.error('Failed to save cloud accounts:', err);
  }
}

function cleanUsername(u) {
  return (u || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const action = req.query?.action || new URL(req.url, 'http://localhost').searchParams.get('action');

  try {
    let body = {};
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    const accounts = await fetchCloudAccounts();

    // ── SIGN UP ─────────────────────────────────────────────────────────────
    if (action === 'signup') {
      const username = cleanUsername(body.username);
      const password = (body.password || '').trim();
      const displayName = (body.displayName || username).trim();

      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters (letters, numbers, _)' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      if (accounts[username]) {
        return res.status(409).json({ error: 'This username is already taken. Try another!' });
      }

      const defaultProfile = {
        name: displayName || username,
        nativeLanguage: 'Bengali (বাংলা)',
        level: 'beginner',
        learningGoal: 'Confident Daily English Speaking',
        timeline: '30',
        xpGoal: 50,
      };

      const newUser = {
        id: 'user_' + username + '_' + Date.now(),
        username,
        displayName,
        password,
        profile: body.profile || defaultProfile,
        created_at: new Date().toISOString(),
        user_metadata: {
          username,
          display_name: displayName,
        },
      };

      accounts[username] = newUser;
      await saveCloudAccounts(accounts);

      // Don't leak raw password in response
      const safeUser = { ...newUser };
      delete safeUser.password;
      return res.status(200).json({ user: safeUser, session: { user: safeUser } });
    }

    // ── SIGN IN ─────────────────────────────────────────────────────────────
    if (action === 'signin') {
      const username = cleanUsername(body.username);
      const password = (body.password || '').trim();

      if (!username || !password) {
        return res.status(400).json({ error: 'Please enter both username and password' });
      }

      const user = accounts[username];
      if (!user) {
        return res.status(404).json({ error: `Account '@${username}' not found. Please check your spelling or sign up below.` });
      }

      if (user.password !== password) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }

      const safeUser = { ...user };
      delete safeUser.password;
      return res.status(200).json({ user: safeUser, session: { user: safeUser } });
    }

    // ── SYNC PROFILE & PROGRESS ─────────────────────────────────────────────
    if (action === 'sync') {
      const username = cleanUsername(body.username);
      if (username && accounts[username]) {
        if (body.profile) accounts[username].profile = { ...accounts[username].profile, ...body.profile };
        if (body.progress) accounts[username].progress = body.progress;
        await saveCloudAccounts(accounts);
        return res.status(200).json({ success: true });
      }
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  } catch (err) {
    console.error('Cloud auth API error:', err);
    return res.status(500).json({ error: 'Authentication service temporarily unavailable' });
  }
}
