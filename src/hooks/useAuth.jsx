import { useState, createContext, useContext } from 'react';
import {
  getDiscordOAuthUrl,
  isDiscordConfigured,
  DISCORD_CONFIG,
} from '../config/discord.js';

/**
 * Authentication Context
 *
 * RTR uses Discord OAuth as its only sign-in method. The secure token
 * exchange happens on the backend (see server/index.js); this context just
 * kicks off the OAuth redirect and forwards the returned code to the backend.
 */
const AuthContext = createContext();

const STORAGE_KEY = 'rtr_user';
const STATE_KEY = 'discord_oauth_state';

/**
 * Read the persisted user from localStorage (used as a lazy initial state).
 * @returns {Object|null} Stored user or null
 */
const readStoredUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Error loading auth state:', err);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

/**
 * Authentication Provider Component
 *
 * Provides authentication state and methods to the entire app and persists
 * the signed-in user in localStorage.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Auth provider component
 */
export const AuthProvider = ({ children }) => {
  // Initialise synchronously from localStorage (no effect needed)
  const [user, setUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Begin Discord OAuth.
   * Generates a CSRF "state" token, stores it, and redirects to Discord.
   */
  const loginWithDiscord = () => {
    setError(null);

    if (!isDiscordConfigured()) {
      setError('Discord login is not configured yet. Set VITE_DISCORD_CLIENT_ID in .env');
      return;
    }

    // CSRF protection: round-trip a random token through Discord and verify
    // it on return.
    const state =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(36).slice(2);

    sessionStorage.setItem(STATE_KEY, state);
    window.location.href = getDiscordOAuthUrl(state);
  };

  /**
   * Handle the Discord OAuth callback.
   * Verifies the CSRF state, then asks the backend to exchange the code and
   * return the user profile.
   *
   * @param {string} code - Authorization code from Discord
   * @param {string} returnedState - State value Discord echoed back
   * @returns {Promise<boolean>} Success status
   */
  const handleDiscordCallback = async (code, returnedState) => {
    try {
      setIsLoading(true);
      setError(null);

      const expectedState = sessionStorage.getItem(STATE_KEY);
      sessionStorage.removeItem(STATE_KEY);

      if (!expectedState || expectedState !== returnedState) {
        throw new Error('Invalid authentication state. Please try signing in again.');
      }

      const response = await fetch(DISCORD_CONFIG.CALLBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Discord authentication failed. Please try again.');
      }

      const { user: userData } = await response.json();

      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return true;
    } catch (err) {
      console.error('Discord callback error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout: clears user state and persisted session.
   */
  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Clear any auth errors.
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginWithDiscord,
    handleDiscordCallback,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 *
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
