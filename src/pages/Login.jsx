import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_CONSTANTS } from '../app-constants';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithDiscord, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDiscordLogin = async () => {
    setError('');
    try {
      await loginWithDiscord();
    } catch (err) {
      setError(err.message || 'Discord login failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        navigate('/onboarding');
      } else {
        await signInWithEmail(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const auth = APP_CONSTANTS.AUTH;

  return (
    <div className="auth-container">
      <div className="rtr-card p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2">
          {isSignUp ? auth.SIGN_UP_TITLE : auth.LOGIN_TITLE}
        </h2>
        <p className="text-gray-400 mb-6">
          {isSignUp ? auth.SIGN_UP_SUBTITLE : auth.LOGIN_SUBTITLE}
        </p>

        {/* ✅ Discord button – only shown on Sign In tab */}
        {!isSignUp && (
          <>
            <button
              onClick={handleDiscordLogin}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 mb-4"
            >
              <i className="fab fa-discord text-xl"></i> {auth.DISCORD_LOGIN}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0a0a0a] px-2 text-gray-400">{auth.OR_SEPARATOR}</span>
              </div>
            </div>
          </>
        )}

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        {/* Email/Password Form – visible on both tabs */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={auth.EMAIL_LABEL}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full mb-3"
            required
          />
          <input
            type="password"
            placeholder={auth.PASSWORD_LABEL}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input w-full mb-3"
            required
            minLength={auth.PASSWORD_MIN_LENGTH || 6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading
              ? auth.CONNECTING_DISCORD
              : isSignUp
              ? auth.SIGN_UP_BUTTON
              : auth.SIGN_IN_BUTTON}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          {isSignUp ? auth.ALREADY_ACCOUNT : auth.NO_ACCOUNT}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:underline ml-1"
          >
            {isSignUp ? auth.SIGN_IN_BUTTON : auth.CREATE_ONE}
          </button>
        </p>

        <p className="text-xs text-gray-500 mt-2 text-center">
          {auth.LOGIN_FOOTNOTE}
        </p>

        {!isSignUp && (
          <p className="text-xs text-center mt-2">
            <a href="/reset-password" className="text-blue-400 hover:underline">
              Forgot password?
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;