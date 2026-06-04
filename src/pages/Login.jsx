import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { APP_CONSTANTS } from '../app-constants';

/**
 * Login Page Component
 *
 * RTR uses Discord OAuth as its only sign-in method, so this page is a single
 * "Continue with Discord" action. Any OAuth error is surfaced via the
 * ?error= query param set by the callback page.
 *
 * @returns {JSX.Element} Login page
 */
const Login = () => {
  const [searchParams] = useSearchParams();
  const { loginWithDiscord, isLoading, error } = useAuth();

  // Local "redirecting to Discord" state so the button shows a loader the
  // instant it's clicked, before the browser navigates away to Discord.
  const [redirecting, setRedirecting] = useState(false);

  const handleDiscordLogin = () => {
    // Only show the loader if we'll actually redirect; otherwise an error
    // (e.g. missing config) is surfaced and the button stays interactive.
    if (isSupabaseConfigured()) {
      setRedirecting(true);
    }
    loginWithDiscord();
  };

  const busy = isLoading || redirecting;

  // Map a callback ?error= code to a friendly message (falls back to the
  // context error or a generic message).
  const errorCode = searchParams.get('error');
  const errorMessage = errorCode
    ? APP_CONSTANTS.AUTH.ERRORS[errorCode] || APP_CONSTANTS.AUTH.ERRORS.default
    : error;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {APP_CONSTANTS.AUTH.LOGIN_TITLE}
          </h1>
          <p className="text-gray-400">
            {APP_CONSTANTS.AUTH.LOGIN_SUBTITLE}
          </p>
        </div>

        {/* Sign-in Card */}
        <div className="rtr-card">

          {/* Error Display */}
          {errorMessage && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-red-400"></i>
                <span className="text-red-400 text-sm">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Discord Login Button */}
          <button
            type="button"
            onClick={handleDiscordLogin}
            disabled={busy}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#5865f2]/20 hover:shadow-[#5865f2]/30 hover:transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {busy ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{APP_CONSTANTS.AUTH.CONNECTING_DISCORD}</span>
              </>
            ) : (
              <>
                <i className="fab fa-discord text-xl"></i>
                <span>{APP_CONSTANTS.AUTH.DISCORD_LOGIN}</span>
              </>
            )}
          </button>

          {/* Footnote */}
          <p className="mt-6 text-center text-xs text-gray-500">
            {APP_CONSTANTS.AUTH.LOGIN_FOOTNOTE}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
