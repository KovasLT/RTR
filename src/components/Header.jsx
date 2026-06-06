import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_CONSTANTS } from '../app-constants';
import { useAuth } from '../hooks/useAuth.jsx';

const NAV = APP_CONSTANTS.NAV;

const NAV_LINKS = [
  { to: '/', label: NAV.HOME, exact: true },
  { to: '/news', label: NAV.NEWS },
  { to: '/directory', label: NAV.DIRECTORY },
  { to: '/teams', label: NAV.TEAMS_RANKING },
  { to: '/players', label: NAV.PLAYERS_RANKING },
  { to: '/community', label: NAV.INFORMATION },
];

/**
 * Header Component
 *
 * Sticky top navigation: brand, centered primary nav, and a right-hand auth
 * cluster. When signed in, the per-user actions (Dashboard, Admin, Profile,
 * Edit, Logout) collapse into a single avatar dropdown to keep the bar
 * uncluttered. A hamburger panel covers smaller screens.
 */
const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false); // user dropdown (desktop)
  const [mobileOpen, setMobileOpen] = useState(false); // mobile panel

  const isActiveRoute = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const navLinkClass = (path, exact) => {
    const active = isActiveRoute(path, exact);
    return `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'text-white bg-gray-800' : 'text-slate-400 hover:text-slate-200 hover:bg-gray-800/60'
    }`;
  };

  const closeAll = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const avatar = user?.avatar ? (
    <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded-full object-cover" />
  ) : (
    <span className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
      <i className="fas fa-user text-xs"></i>
    </span>
  );

  // The per-user links shared by the desktop dropdown and the mobile panel.
  const userLinks = (
    <>
      <Link to="/dashboard" onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
        <i className="fas fa-gauge-high w-4 text-center"></i>{NAV.DASHBOARD}
      </Link>
      {user?.isAdmin && (
        <Link to="/admin" onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-300 hover:bg-gray-800 hover:text-amber-200">
          <i className="fas fa-shield-halved w-4 text-center"></i>{NAV.ADMIN}
        </Link>
      )}
      <Link to="/profile" onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
        <i className="fas fa-user w-4 text-center"></i>{NAV.PROFILE}
      </Link>
      <Link to="/profile/edit" onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
        <i className="fas fa-user-pen w-4 text-center"></i>{NAV.EDIT_PROFILE}
      </Link>
      <div className="my-1 h-px bg-gray-800"></div>
      <button
        onClick={() => { closeAll(); logout(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
      >
        <i className="fas fa-sign-out-alt w-4 text-center"></i>{NAV.LOGOUT}
      </button>
    </>
  );

  return (
    <header className="bg-[#111111] border-b border-gray-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/" onClick={closeAll} className="flex items-center gap-3 shrink-0">
          <div className="bg-gray-700 text-white font-black px-2 py-1 rounded tracking-widest text-xl">
            {APP_CONSTANTS.BRAND.NAME}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-white font-bold text-sm leading-tight uppercase tracking-wide">
              {APP_CONSTANTS.BRAND.FULL_NAME}
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
              {APP_CONSTANTS.BRAND.TAGLINE}
            </p>
          </div>
        </Link>

        {/* Primary nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={navLinkClass(l.to, l.exact)}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
              >
                {avatar}
                <span className="max-w-[10rem] truncate">{user?.username}</span>
                <i className={`fas fa-chevron-down text-xs text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-[#13192b] border border-gray-700 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                    {userLinks}
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeAll}
              className="hidden lg:flex bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-bold py-2 px-4 rounded-lg transition shadow-lg shadow-[#5865f2]/20 items-center gap-2"
            >
              <i className="fab fa-discord"></i>
              {APP_CONSTANTS.AUTH.SIGN_IN}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-800"
            aria-label={NAV.MENU}
          >
            <i className={`fas ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-800 bg-[#111111]">
          <nav className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={closeAll} className={`block ${navLinkClass(l.to, l.exact)}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-800 py-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
                  {avatar}
                  <span className="truncate">{user?.username}</span>
                </div>
                {userLinks}
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeAll}
                className="mx-4 my-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <i className="fab fa-discord"></i>
                {APP_CONSTANTS.AUTH.SIGN_IN}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
