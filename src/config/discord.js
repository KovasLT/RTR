/**
 * Discord OAuth Configuration (frontend)
 *
 * Only non-secret values live here. The Client Secret and the token exchange
 * are handled by the backend (see server/index.js). The frontend just builds
 * the authorize URL and forwards the returned code to the backend.
 *
 * Setup:
 *   1. Create a Discord app: https://discord.com/developers/applications
 *   2. OAuth2 -> add redirect URI: http://localhost:5173/auth/discord/callback
 *   3. Copy the Client ID into .env as VITE_DISCORD_CLIENT_ID
 *   4. Put the Client Secret in server/.env (NOT here)
 */

const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || '';

const REDIRECT_URI =
  import.meta.env.VITE_DISCORD_REDIRECT_URI ||
  `${window.location.origin}/auth/discord/callback`;

export const DISCORD_CONFIG = {
  CLIENT_ID,
  REDIRECT_URI,

  // Scopes: identify (basic profile) + email
  SCOPES: ['identify', 'email'].join(' '),

  // Discord's authorize endpoint (the only Discord URL the browser hits)
  OAUTH_URL: 'https://discord.com/api/oauth2/authorize',

  // Our backend endpoint that securely exchanges the code for a token
  CALLBACK_ENDPOINT: '/api/auth/discord/callback',
};

/**
 * Whether a Client ID has been configured.
 * @returns {boolean}
 */
export const isDiscordConfigured = () => Boolean(DISCORD_CONFIG.CLIENT_ID);

/**
 * Generate the Discord OAuth authorization URL.
 * @param {string} [state] - CSRF state token to round-trip through Discord.
 * @returns {string} Discord OAuth URL
 */
export const getDiscordOAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CONFIG.CLIENT_ID,
    redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
    response_type: 'code',
    scope: DISCORD_CONFIG.SCOPES,
  });

  if (state) {
    params.set('state', state);
  }

  return `${DISCORD_CONFIG.OAUTH_URL}?${params.toString()}`;
};
