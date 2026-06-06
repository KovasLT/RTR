import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Authentication Context (Supabase + Discord)
 *
 * Auth is handled by Supabase's Discord provider. This context keeps the same
 * surface the app already used (`user`, `isAuthenticated`, `loginWithDiscord`,
 * `logout`, ...) and adds `roles` / `needsOnboarding` for the new platform.
 */
const AuthContext = createContext();

/**
 * Shape the auth user + profile row into the `user` object the UI expects.
 */
const mapUser = (authUser, profile) => {
  if (!authUser) return null;
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? null,
    username:
      profile?.display_name ||
      profile?.handle ||
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      'Player',
    handle: profile?.handle || meta.user_name || null,
    avatar: profile?.avatar_url || meta.avatar_url || null,
    discordId: profile?.discord_id || meta.provider_id || null,
    bio: profile?.bio || null,
    regionId: profile?.region_id || null,
    // Super users are higher-privileged admins: they get the admin dashboard
    // too, so isAdmin is true for either flag. isSuperuser distinguishes them.
    isAdmin: profile?.is_admin || profile?.is_superuser || false,
    isSuperuser: profile?.is_superuser || false,
    provider: 'discord',
    createdAt: profile?.created_at || authUser.created_at,
  };
};

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  // Start "loading" only when Supabase is configured (else there's nothing to load).
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [error, setError] = useState(null);

  // Load the profile row + claimed roles for a user id.
  const loadProfile = useCallback(async (uid) => {
    if (!supabase || !uid) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', uid),
    ]);
    setProfile(prof ?? null);
    setRoles((roleRows ?? []).map((r) => r.role));
  }, []);

  // Initialise session + subscribe to auth changes.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let active = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      setAuthUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setIsLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Start Discord OAuth via Supabase. Redirects the browser.
   */
  const loginWithDiscord = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError(
        'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env',
      );
      return;
    }
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/discord/callback`,
        scopes: 'identify email',
      },
    });
    if (err) setError(err.message);
  }, []);

  /**
   * Sign out and clear local state.
   */
  const logout = useCallback(async () => {
    setError(null);
    if (supabase) await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
    setRoles([]);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshProfile = useCallback(() => {
    if (authUser) return loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const value = {
    user: mapUser(authUser, profile),
    profile,
    roles,
    isLoading,
    error,
    isAuthenticated: !!authUser,
    // A signed-in user with no roles yet still needs to set up their profile.
    needsOnboarding: !!authUser && roles.length === 0,
    loginWithDiscord,
    logout,
    clearError,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use authentication context.
 * @returns {Object} Authentication state and methods
 * @throws {Error} If used outside AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
