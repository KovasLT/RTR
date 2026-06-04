# Discord OAuth Setup Guide

RTR uses **Discord OAuth as its only sign-in method**. The secure token
exchange runs on a small backend so your Client Secret never ships to the
browser.

```
Browser → Discord login → ?code=... at /auth/discord/callback
       → frontend POSTs { code } to /api/auth/discord/callback
       → backend exchanges code + secret with Discord
       → backend returns the user → signed in
```

## 1. Create a Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** → name it (e.g. "RTR – Rising Teams Rating") → **Create**

## 2. Configure OAuth2

1. Open **OAuth2 → General**
2. Under **Redirects**, add:
   ```
   http://localhost:5173/auth/discord/callback
   ```
   (Add your production URL too when you deploy, e.g.
   `https://yourdomain.com/auth/discord/callback`.)
3. Copy the **Client ID**
4. Click **Reset Secret** and copy the **Client Secret**

> The redirect URI must match **exactly** (scheme, host, port, path) in all
> three places: the Discord dashboard, `.env`, and `server/.env`.

## 3. Add your credentials

**Frontend** — `.env` (already created; non-secret values only):

```bash
VITE_DISCORD_CLIENT_ID=your_client_id_here
VITE_DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback
```

**Backend** — `server/.env` (the secret lives here, gitignored):

```bash
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback
CLIENT_ORIGIN=http://localhost:5173
PORT=3001
```

`.env` and `server/.env` are gitignored. Templates are committed as
`.env.example` and `server/.env.example`.

## 4. Run it

Run the frontend and auth backend together:

```bash
npm run dev:all
```

Or run them separately in two terminals:

```bash
npm run server   # auth backend on http://localhost:3001
npm run dev       # frontend on http://localhost:5173
```

Health check: open <http://localhost:3001/api/health> — it reports whether the
server picked up your credentials.

## 5. Test the flow

1. Go to <http://localhost:5173/login>
2. Click **Continue with Discord**
3. Authorize on Discord
4. You're redirected back and signed in; your profile shows your Discord
   avatar and name.

## How it's wired

| Concern | Location |
| --- | --- |
| Build authorize URL + CSRF state | `src/config/discord.js`, `src/hooks/useAuth.jsx` |
| Frontend callback route | `src/pages/DiscordCallback.jsx` (`/auth/discord/callback`) |
| Secure token exchange | `server/index.js` (`POST /api/auth/discord/callback`) |
| Dev proxy `/api → :3001` | `vite.config.js` |

Security notes:
- The Client Secret is only ever read by the backend from `server/.env`.
- A random `state` token is round-tripped through Discord and verified on
  return (CSRF protection).
- The Discord access token stays on the server and is not sent to the browser.

## Production deployment

1. Host the backend (`server/index.js`) somewhere with the env vars set.
2. Set `CLIENT_ORIGIN` to your deployed frontend origin and add the production
   redirect URI in the Discord dashboard.
3. Serve the frontend over HTTPS and either proxy `/api` to the backend or set
   `VITE_DISCORD_REDIRECT_URI` / the API base accordingly.
4. Consider issuing your own session cookie/JWT from the backend instead of
   storing the user in `localStorage`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `invalid redirect_uri` | The URI must match exactly in Discord, `.env`, and `server/.env` (including the port). |
| Button says "not configured" | `VITE_DISCORD_CLIENT_ID` is empty — set it in `.env` and restart `npm run dev`. |
| `server_not_configured` (500) | `server/.env` is missing the ID/secret — fill it in and restart the server. |
| `Invalid authentication state` | Don't reuse old callback URLs; start the login again from `/login`. |
| `token_exchange_failed` (401) | Wrong secret or redirect URI mismatch — re-check `server/.env`. |

---

- [Discord OAuth2 docs](https://discord.com/developers/docs/topics/oauth2)
- [Discord API reference](https://discord.com/developers/docs/reference)
