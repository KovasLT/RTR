/**
 * Profile cache (the signed-in user's own profile).
 *
 * Goal: avoid re-running the multi-request `useProfile` waterfall on every site
 * load. We cache a snapshot of the current user's profile and read it first.
 *
 * Storage strategy (each layer guarded so a blocked/throwing layer falls
 * through to the next):
 *   1. Cookie  `Xauth_user_profile`   — primary
 *   2. sessionStorage                 — fallback when cookies are refused
 *
 * The payload is non-sensitive display data only (name, avatar, roles, region,
 * player basics, ratings). The real Supabase session/token is NOT stored here —
 * Supabase manages that itself.
 *
 * Every entry is bound to a user id and stamped with a timestamp, so a stale
 * snapshot or an account switch self-heals (expired / mismatched → cache miss).
 */

export const COOKIE_NAME = 'Xauth_user_profile';

// 2 days, matching the app's short-lived cache convention.
const TTL_MS = 2 * 24 * 60 * 60 * 1000;
const TTL_SEC = Math.floor(TTL_MS / 1000);

// ---- low-level cookie helpers ----------------------------------------------

const getCookie = (name) => {
  try {
    const prefix = `${name}=`;
    const hit = document.cookie
      .split('; ')
      .find((row) => row.startsWith(prefix));
    return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
  } catch {
    return null;
  }
};

const setCookie = (name, value) => {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${TTL_SEC}; Path=/; SameSite=Lax`;
    // Read back: confirms cookies aren't blocked and the value fit (≈4KB cap).
    return getCookie(name) === value;
  } catch {
    return false;
  }
};

const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  } catch {
    /* ignore */
  }
};

// ---- sessionStorage fallback helpers ---------------------------------------

const ssGet = (key) => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const ssSet = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const ssRemove = (key) => {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

// ---- public API ------------------------------------------------------------

/**
 * Read the cached entry for a user id. Returns `{ data, ts }` or null on miss
 * (no entry, expired, malformed, or different user).
 * @param {string} uid
 */
export const readProfileCacheEntry = (uid) => {
  if (!uid) return null;
  const raw = getCookie(COOKIE_NAME) ?? ssGet(COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.uid !== uid) return null;
    if (!parsed.ts || Date.now() - parsed.ts > TTL_MS) return null;
    return { data: parsed.data, ts: parsed.ts };
  } catch {
    return null;
  }
};

/** Convenience: cached profile data only (or null). */
export const readProfileCache = (uid) => readProfileCacheEntry(uid)?.data ?? null;

/** Convenience: timestamp the cache was written (ms), or undefined on miss. */
export const readProfileCacheTime = (uid) => readProfileCacheEntry(uid)?.ts;

/**
 * Write a profile snapshot for a user id. Tries the cookie first; if cookies
 * are blocked (or the payload exceeds the ~4KB cookie cap), falls back to
 * sessionStorage. Keeps the two stores from diverging.
 * @param {string} uid
 * @param {object} data
 */
export const writeProfileCache = (uid, data) => {
  if (!uid || !data) return;
  const payload = JSON.stringify({ uid, ts: Date.now(), data });
  if (setCookie(COOKIE_NAME, payload)) {
    ssRemove(COOKIE_NAME); // cookie is source of truth; drop any stale fallback
    return;
  }
  // Cookie unavailable → sessionStorage fallback.
  ssSet(COOKIE_NAME, payload);
};

/**
 * Patch fields of the cached profile in place (no refetch). Used to keep the
 * snapshot in sync after a small optimistic update (e.g. the L.F.T toggle).
 * @param {string} uid
 * @param {(data: object) => object} updater
 */
export const patchProfileCache = (uid, updater) => {
  const entry = readProfileCacheEntry(uid);
  if (!entry) return;
  try {
    writeProfileCache(uid, updater(entry.data));
  } catch {
    /* ignore */
  }
};

/** Clear the cache from every store (call on logout and on profile edit). */
export const clearProfileCache = () => {
  deleteCookie(COOKIE_NAME);
  ssRemove(COOKIE_NAME);
};
