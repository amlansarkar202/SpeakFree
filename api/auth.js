// SpeakFree Universal Multi-Replica Cloud Account Engine
// Triple-replica cloud persistence for 100% cross-device sync reliability

const REPLICA_STORES = [
  'https://api.restful-api.dev/objects/ff808181a09d98f701a188da530a561b',
  'https://api.restful-api.dev/objects/ff808181a09d98f701a1893a56f2573a',
  'https://api.restful-api.dev/objects/ff808181a09d98f701a1893bf41b573c',
];

// In-memory cache for fast hot lambdas
let memoryAccounts = null;
let lastFetch = 0;

async function fetchCloudAccounts() {
  const now = Date.now();
  if (memoryAccounts && Object.keys(memoryAccounts).length > 0 && now - lastFetch < 3000) {
    return memoryAccounts;
  }

  const merged = { ...(memoryAccounts || {}) };
  let anySuccess = false;

  const fetchPromises = REPLICA_STORES.map(async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const doc = await res.json();
        const accs = doc?.data?.accounts;
        if (accs && typeof accs === 'object') {
          anySuccess = true;
          Object.assign(merged, accs);
        }
      }
    } catch (err) {
      clearTimeout(timeout);
    }
  });

  await Promise.all(fetchPromises);

  if (anySuccess || Object.keys(merged).length > 0) {
    memoryAccounts = merged;
    lastFetch = now;
  }
  return memoryAccounts || {};
}

async function saveCloudAccounts(accounts) {
  memoryAccounts = accounts;
  lastFetch = Date.now();

  const bodyStr = JSON.stringify({
    name: 'speakfree_accounts_store_v1',
    data: { accounts },
  });

  const savePromises = REPLICA_STORES.map(async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch (err) {
      clearTimeout(timeout);
      return false;
    }
  });

  const results = await Promise.all(savePromises);
  const successCount = results.filter(Boolean).length;
  return successCount > 0;
}

function cleanUsername(u) {
  return (u || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on?.('data', (c) => {
      raw += c;
    });
    req.on?.('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on?.('error', () => resolve({}));
    if (!req.on) resolve({});
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query?.action || new URL(req.url, 'http://localhost').searchParams.get('action');

  try {
    const body = await parseBody(req);
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
        return res.status(409).json({ error: `The username '@${username}' is already taken. Please choose another.` });
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
      const saved = await saveCloudAccounts(accounts);
      if (!saved) {
        return res.status(503).json({ error: 'Cloud storage temporarily busy. Please try again.' });
      }

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
        return res.status(404).json({ error: `Account '@${username}' not found. Please verify spelling or create an account.` });
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
        if (body.profile) {
          accounts[username].profile = { ...accounts[username].profile, ...body.profile };
          if (body.profile.name) {
            accounts[username].displayName = body.profile.name;
            if (accounts[username].user_metadata) {
              accounts[username].user_metadata.display_name = body.profile.name;
            }
          }
        }
        if (body.progress) {
          accounts[username].progress = { ...(accounts[username].progress || {}), ...body.progress };
        }
        await saveCloudAccounts(accounts);
        return res.status(200).json({ success: true });
      }
      return res.status(404).json({ error: 'User not found for sync' });
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  } catch (err) {
    console.error('Cloud auth API error:', err);
    return res.status(500).json({ error: 'Authentication service temporarily unavailable' });
  }
}
