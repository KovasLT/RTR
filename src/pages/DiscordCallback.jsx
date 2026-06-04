import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Discord OAuth Callback Page
 *
 * Handles the callback from Discord OAuth flow.
 * Processes the authorization code and logs the user in.
 * Redirects to home page on success or login page on error.
 *
 * @returns {JSX.Element} Loading spinner or error display
 */
const DiscordCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleDiscordCallback, error } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      // Get authorization code + state from URL params
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Handle OAuth error (user denied access, etc.)
      if (errorParam) {
        console.error('Discord OAuth error:', errorParam);
        navigate('/login?error=discord_denied');
        return;
      }

      // Handle missing authorization code
      if (!code) {
        console.error('No authorization code received from Discord');
        navigate('/login?error=discord_invalid');
        return;
      }

      // Process the authorization code (state is verified inside)
      const success = await handleDiscordCallback(code, state);

      if (success) {
        // Redirect to home page on successful login
        navigate('/');
      } else {
        // Redirect to login page with error
        navigate('/login?error=discord_failed');
      }
    };

    processCallback();
  }, [searchParams, handleDiscordCallback, navigate]);

  // Show loading spinner while processing
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

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-red-400"></i>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscordCallback;