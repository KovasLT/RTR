/**
 * RTR Discord OAuth Backend
 *
 * Minimal Express server whose only job is to perform the Discord OAuth
 * "authorization code" exchange. The Client Secret lives here (server-side,
 * loaded from server/.env) and is NEVER shipped to the browser.
 *
 * Flow:
 *   1. Browser sends Discord to authorize, then receives ?code=... at the
 *      frontend callback route.
 *   2. Frontend POSTs { code } to /api/auth/discord/callback.
 *   3. This server exchanges the code (+ secret) for an access token,
 *      fetches the Discord user, and returns a trimmed user object.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express from 'express';
import cors from 'cors';

// Load server/.env relative to THIS file, not the current working directory
// (so it works no matter where `node server/index.js` is launched from).
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  CLIENT_ORIGIN = 'http://localhost:5173',
  PORT = 3001,
} = process.env;

const DISCORD_API = 'https://discord.com/api';

const app = express();
app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

/**
 * Compute a user's avatar URL, falling back to Discord's default avatars.
 */
const buildAvatarUrl = (discordUser) => {
  if (discordUser.avatar) {
    return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`;
  }
  // Default avatar index for the new username system: (id >> 22) % 6
  const index = Number((BigInt(discordUser.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) });
});

app.post('/api/auth/discord/callback', async (req, res) => {
  const { code } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'missing_code' });
  }

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
    console.error('Server is missing Discord OAuth env vars. Check server/.env');
    return res.status(500).json({ error: 'server_not_configured' });
  }

  try {
    // 1. Exchange the authorization code for an access token.
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text();
      console.error('Discord token exchange failed:', tokenResponse.status, detail);
      return res.status(401).json({ error: 'token_exchange_failed' });
    }

    const token = await tokenResponse.json();

    // 2. Use the access token to fetch the user's Discord profile.
    const userResponse = await fetch(`${DISCORD_API}/v10/users/@me`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!userResponse.ok) {
      const detail = await userResponse.text();
      console.error('Discord user fetch failed:', userResponse.status, detail);
      return res.status(401).json({ error: 'user_fetch_failed' });
    }

    const d = await userResponse.json();

    // 3. Return only the fields the frontend needs. The access token is NOT
    //    sent to the browser.
    const user = {
      id: `discord_${d.id}`,
      discordId: d.id,
      username: d.global_name || d.username,
      handle: d.username,
      email: d.email ?? null,
      avatar: buildAvatarUrl(d),
      provider: 'discord',
      createdAt: new Date().toISOString(),
    };

    return res.json({ user });
  } catch (err) {
    console.error('Discord callback error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`RTR auth server listening on http://localhost:${PORT}`);
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    console.warn('⚠️  Discord OAuth env vars not set yet. Fill in server/.env');
  }
});
