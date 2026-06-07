/**
 * Supabase client (browser)
 *
 * Reads non-secret config from Vite env. The anon key is publishable and is
 * meant to live in the frontend; Row-Level Security in the database is what
 * actually protects data.
 *
 * Setup: create a Supabase project, then put these in `.env`:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Whether Supabase env vars are present.
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

/**
 * The shared Supabase client, or null if not configured yet (so the app can
 * still render a "setup needed" state instead of crashing).
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;
