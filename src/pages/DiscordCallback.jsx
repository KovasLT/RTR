import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Discord OAuth Callback Page (Supabase)
 *
 * Supabase's client auto-exchanges the OAuth code in the URL (detectSessionInUrl
 * + PKCE). We just wait for the session to land, then route the user to
 * onboarding (no roles yet) or home. A timeout guards against a stuck exchange.
 *
 * @returns {JSX.Element} Loading spinner
 */
const DiscordCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Discord/Supabase can return an explicit error in the URL.
  const oauthError =
    searchParams.get('error') || searchParams.get('error_description');

  useEffect(() => {
    if (oauthError) {
      navigate('/login?error=discord_failed', { replace: true });
    }
  }, [oauthError, navigate]);

  // Once the session is resolved, route onward.
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      navigate(needsOnboarding ? '/onboarding' : '/', { replace: true });
    }
  }, [isLoading, isAuthenticated, needsOnboarding, navigate]);

  // Fallback: if no session shows up in a reasonable time, bounce to login.
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timedOut && !isAuthenticated) {
      navigate('/login?error=discord_failed', { replace: true });
    }
  }, [timedOut, isAuthenticated, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">
            {APP_CONSTANTS.AUTH.CALLBACK_TITLE}
          </h2>
          <p className="text-gray-400">
            {APP_CONSTANTS.AUTH.CALLBACK_SUBTITLE}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscordCallback;
