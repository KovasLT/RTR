import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { clearProfileCache } from '../lib/profileCache.js';

const AuthContext = createContext();

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
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [error, setError] = useState(null);

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

  // --- Existing session init (UNCHANGED) ---
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

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

  // --- Existing Discord OAuth (UNCHANGED) ---
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

  // --- NEW: Email/Password Sign In ---
  const signInWithEmail = useCallback(async (email, password) => {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured.');
      return;
    }
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setError(err.message);
      throw err;
    }
    return data.user;
  }, []);

  // --- NEW: Email/Password Sign Up ---
  const signUpWithEmail = useCallback(async (email, password) => {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured.');
      return;
    }
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
    });
    if (err) {
      setError(err.message);
      throw err;
    }
    return data.user;
  }, []);

  // --- Existing logout (UNCHANGED) ---
  const logout = useCallback(async () => {
    setError(null);
    clearProfileCache();
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
    needsOnboarding: !!authUser && roles.length === 0,
    loginWithDiscord,     // <- Existing
    signInWithEmail,      // <- NEW (add this line)
    signUpWithEmail,      // <- NEW (add this line)
    logout,
    clearError,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};