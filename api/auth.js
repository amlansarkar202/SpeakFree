// SpeakFree Universal Cloud Account Engine
// Powered by official Vercel Blob Cloud Storage for unlimited, cross-device persistence

import { put } from '@vercel/blob';

const BLOB_BASE = 'https://kvodo4vlbna9aja5.public.blob.vercel-storage.com';

function cleanUsername(u) {
  return (u || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

const memoryUserCache = new Map();

async function getUser(username) {
  if (memoryUserCache.has(username)) {
    return memoryUserCache.get(username);
  }

  try {
    const res = await fetch(`${BLOB_BASE}/users/${username}.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, max-age=0' },
    });
    if (res.ok) {
      const user = await res.json();
      memoryUserCache.set(username, user);
      return user;
    }
  } catch (err) {
    console.warn('Fetch user blob error:', err.message);
  }
  return null;
}

async function saveUser(username, userData) {
  memoryUserCache.set(username, userData);
  try {
    await put(`users/${username}.json`, JSON.stringify(userData), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return true;
  } catch (err) {
    console.error('Save user blob error:', err);
    return false;
  }
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

      // Check if username is already taken
      const existing = await getUser(username);
      if (existing) {
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

      const saved = await saveUser(username, newUser);
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

      const user = await getUser(username);
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
      if (!username) {
        return res.status(400).json({ error: 'Username required for sync' });
      }

      const user = await getUser(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found for sync' });
      }

      if (body.profile) {
        user.profile = { ...(user.profile || {}), ...body.profile };
        if (body.profile.name) {
          user.displayName = body.profile.name;
          if (user.user_metadata) {
            user.user_metadata.display_name = body.profile.name;
          }
        }
      }
      if (body.progress) {
        user.progress = { ...(user.progress || {}), ...body.progress };
      }

      await saveUser(username, user);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  } catch (err) {
    console.error('Cloud auth API error:', err);
    return res.status(500).json({ error: 'Authentication service temporarily unavailable' });
  }
}
