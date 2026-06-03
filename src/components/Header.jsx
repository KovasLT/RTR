import { Link, useLocation } from 'react-router-dom';
import { APP_CONSTANTS } from '../app-constants';

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

    // Active route styling: indigo color with bottom border
    if (isActiveRoute(path)) {
      return `${baseClasses} text-indigo-400 border-indigo-500`;
    }

    // Inactive route styling: gray with hover effects
    return `${baseClasses} text-slate-400 border-transparent hover:text-slate-200`;
  };

  return (
    // ========================================
    // MAIN HEADER CONTAINER
    // ========================================
    <header className="bg-[#0f1423] border-b border-slate-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ========================================
            BRAND/LOGO SECTION (Left)
            ======================================== */}
        <div className="flex items-center gap-3">
          {/* RTR Logo Badge */}
          <div className="bg-indigo-600 text-white font-black px-2 py-1 rounded tracking-widest text-xl">
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
            DISCORD CTA BUTTON (Right)
            ======================================== */}
        <a
          href="#"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition shadow-lg shadow-indigo-500/20"
        >
          <i className={`${APP_CONSTANTS.ICONS.DISCORD} mr-2`}></i>
          {APP_CONSTANTS.NAV.JOIN_DISCORD}
        </a>
      </div>
    </header>
  );
};

export default Header;