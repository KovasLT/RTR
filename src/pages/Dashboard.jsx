import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfiles.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

const D = APP_CONSTANTS.DASHBOARD;
const ALL_ROLES = ['player', 'coach', 'scout', 'team_manager', 'tournament_manager'];

const RatingBadge = ({ value }) =>
  value == null ? null : (
    <span className="text-indigo-300 font-mono font-bold text-sm">
      {D.RATING}: {value}
    </span>
  );

const ComingSoon = ({ text }) => (
  <div className="mt-3 inline-flex items-center gap-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-1">
    <i className="fas fa-clock"></i> {D.COMING_SOON} — {text}
  </div>
);

/** One panel per role. Player is live; the rest scaffold their responsibilities. */
const RolePanel = ({ role, profile }) => {
  const rating = profile?.ratings?.find((r) => r.subject_type === role)?.rating;

  if (role === 'player') {
    const p = profile?.player;
    return (
      <div className="rtr-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{D.PLAYER_TITLE}</h3>
          <RatingBadge value={rating} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500">{APP_CONSTANTS.PROFILE_PAGE.LANE}</div>
            <div className="text-white">{p?.lane?.name || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{APP_CONSTANTS.PROFILE_PAGE.RANK}</div>
            <div className="text-white">{p?.rank?.name || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{APP_CONSTANTS.PROFILE_PAGE.SERVER}</div>
            <div className="text-white">{p?.server || '—'}</div>
          </div>
        </div>
        <p className={`mt-4 text-sm ${p?.looking_for_team ? 'text-green-400' : 'text-gray-400'}`}>
          <i className={`fas ${p?.looking_for_team ? 'fa-search' : 'fa-circle-pause'} mr-2`}></i>
          {p?.looking_for_team ? D.PLAYER_LFT_ON : D.PLAYER_LFT_OFF}
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-white">{D.PLAYER_APPLICATIONS}</h4>
          <ComingSoon text={D.PLAYER_APPLICATIONS_SOON} />
        </div>
      </div>
    );
  }

  const map = {
    coach: { title: D.COACH_TITLE, body: D.COACH_BODY, soon: D.COACH_SOON },
    scout: { title: D.SCOUT_TITLE, body: D.SCOUT_BODY, soon: D.SCOUT_SOON },
    team_manager: { title: D.TEAM_MANAGER_TITLE, body: D.TEAM_MANAGER_BODY, soon: D.TEAM_MANAGER_SOON },
    tournament_manager: {
      title: D.TOURNAMENT_MANAGER_TITLE,
      body: D.TOURNAMENT_MANAGER_BODY,
      soon: D.TOURNAMENT_MANAGER_SOON,
    },
  };
  const m = map[role];
  if (!m) return null;

  return (
    <div className="rtr-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">{m.title}</h3>
        <RatingBadge value={rating} />
      </div>
      <p className="text-sm text-gray-400">{m.body}</p>
      <ComingSoon text={m.soon} />
    </div>
  );
};

/**
 * Role-aware dashboard. Shows a panel for each of the user's roles. Admins get
 * a "view as" selector to preview any role's dashboard.
 */
const Dashboard = () => {
  const { user, roles, isAuthenticated, isLoading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [viewAs, setViewAs] = useState('');

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.isAdmin;
  const visibleRoles = isAdmin && viewAs ? [viewAs] : roles;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{D.TITLE}</h1>
          <p className="text-gray-400">{D.SUBTITLE}</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{D.VIEW_AS}:</span>
            <select
              value={viewAs}
              onChange={(e) => setViewAs(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">{D.VIEWING_AS_ADMIN}</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{APP_CONSTANTS.ROLES[r]}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {visibleRoles.length === 0 ? (
        <div className="rtr-card text-center py-10">
          <h3 className="text-lg font-semibold text-white">{D.NO_ROLES_TITLE}</h3>
          <p className="text-gray-400 mt-1 mb-4">{D.NO_ROLES_BODY}</p>
          <Link to="/onboarding" className="rtr-btn-primary">{D.SET_UP_PROFILE}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRoles.map((role) => (
            <RolePanel key={role} role={role} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
