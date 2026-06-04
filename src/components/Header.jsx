import { Link, useLocation } from 'react-router-dom';
import { APP_CONSTANTS } from '../app-constants';
import { useAuth } from '../hooks/useAuth.jsx';

/**
 * Header Component
 *
 * Main navigation header with RTR branding, navigation menu, and Discord CTA.
 * Features sticky positioning, responsive design, and active route highlighting.
 * Handles routing through React Router with visual feedback for current page.
 *
 * @returns {JSX.Element} Header component with navigation
 */
const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  /**
   * Determines if a given route path is currently active
   * Handles special case for home route and prefix matching for other routes
   *
   * @param {string} path - Route path to check (e.g., '/', '/teams')
   * @returns {boolean} True if the route is currently active
   */
  const isActiveRoute = (path) => {
    // Home route requires exact match
    if (path === '/' && location.pathname === '/') return true;

    // Other routes match if current path starts with the route path
    return path !== '/' && location.pathname.startsWith(path);
  };

  /**
   * Generates CSS classes for navigation links based on active state
   * Applies different styling for active vs inactive navigation items
   *
   * @param {string} path - Route path to generate classes for
   * @returns {string} Complete CSS class string for the navigation link
   */
  const getNavClass = (path) => {
    const baseClasses = "nav-btn h-full px-5 flex items-center text-sm font-semibold border-b-2 transition-colors";

    // Active route styling: grey color with bottom border
    if (isActiveRoute(path)) {
      return `${baseClasses} text-gray-300 border-gray-400`;
    }

    // Inactive route styling: gray with hover effects
    return `${baseClasses} text-slate-400 border-transparent hover:text-slate-200`;
  };

  return (
    // ========================================
    // MAIN HEADER CONTAINER
    // ========================================
    <header className="bg-[#111111] border-b border-gray-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ========================================
            BRAND/LOGO SECTION (Left)
            ======================================== */}
        <div className="flex items-center gap-3">
          {/* RTR Logo Badge */}
          <div className="bg-gray-700 text-white font-black px-2 py-1 rounded tracking-widest text-xl">
            {APP_CONSTANTS.BRAND.NAME}
          </div>

          {/* Brand Text */}
          <div>
            <h1 className="text-white font-bold text-sm leading-tight uppercase tracking-wide">
              {APP_CONSTANTS.BRAND.FULL_NAME}
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
              {APP_CONSTANTS.BRAND.TAGLINE}
            </p>
          </div>
        </div>

        {/* ========================================
            NAVIGATION MENU (Center)
            ======================================== */}
        <nav className="hidden md:flex h-full">
          {/* Home Page Link */}
          <Link to="/" className={getNavClass('/')}>
            {APP_CONSTANTS.NAV.HOME}
          </Link>

          {/* Talent Directory Link */}
          <Link to="/directory" className={getNavClass('/directory')}>
            {APP_CONSTANTS.NAV.DIRECTORY}
          </Link>

          {/* Teams Ranking Page Link */}
          <Link to="/teams" className={getNavClass('/teams')}>
            {APP_CONSTANTS.NAV.TEAMS_RANKING}
          </Link>

          {/* Players Ranking Page Link */}
          <Link to="/players" className={getNavClass('/players')}>
            {APP_CONSTANTS.NAV.PLAYERS_RANKING}
          </Link>

          {/* Community Information Page Link */}
          <Link to="/community" className={getNavClass('/community')}>
            {APP_CONSTANTS.NAV.INFORMATION}
          </Link>
        </nav>

        {/* ========================================
            AUTHENTICATION CONTROLS (Right)
            ======================================== */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            // Authenticated User Menu
            <>
              <Link
                to="/dashboard"
                className="hidden sm:flex text-gray-300 hover:text-white text-sm font-medium transition-colors items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg"
              >
                <i className="fas fa-gauge-high"></i>
                {APP_CONSTANTS.NAV.DASHBOARD}
              </Link>
              {user?.isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:flex text-amber-300 hover:text-amber-200 text-sm font-medium transition-colors items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg"
                >
                  <i className="fas fa-shield-halved"></i>
                  {APP_CONSTANTS.NAV.ADMIN}
                </Link>
              )}
              <Link
                to="/profile"
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg"
              >
                <i className="fas fa-user"></i>
                {user?.username}
              </Link>
              <button
                onClick={logout}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition shadow-lg shadow-gray-700/20 flex items-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                {APP_CONSTANTS.NAV.LOGOUT}
              </button>
            </>
          ) : (
            // Discord-only sign in
            <Link
              to="/login"
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-bold py-2 px-4 rounded-lg transition shadow-lg shadow-[#5865f2]/20 flex items-center gap-2"
            >
              <i className="fab fa-discord"></i>
              {APP_CONSTANTS.AUTH.SIGN_IN}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;