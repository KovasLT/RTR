import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfiles.js';
import { useMyTeams, useMyApplications, useTeamMutations } from '../hooks/useTeams.js';
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

/** Player panel: profile snapshot + applications/invites (Phase 2). */
const PlayerPanel = ({ profile, rating, userId }) => {
  const p = profile?.player;
  const { data: apps = [] } = useMyApplications(userId);
  const { respondToApplication, withdrawApplication } = useTeamMutations();

  return (
    <div className="rtr-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          <i className={`fas ${APP_CONSTANTS.ROLE_ICONS.player} mr-2 text-indigo-300`}></i>
          {D.PLAYER_TITLE}
        </h3>
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

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-white mb-2">{D.PLAYER_APPS_TITLE}</h4>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-400">{D.PLAYER_APPS_EMPTY}</p>
        ) : (
          <div className="space-y-2">
            {apps.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 text-sm border-b border-gray-800 pb-2 last:border-0">
                <span className="text-white font-medium flex-grow">{a.team?.name || '—'}</span>
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  {a.type === 'invite' ? D.APP_INVITE : D.APP_SENT}
                </span>
                {a.status === 'pending' ? (
                  a.type === 'invite' ? (
                    <>
                      <button
                        onClick={() => respondToApplication.mutate({ appId: a.id, accept: true })}
                        className="text-xs font-semibold bg-green-900/30 border border-green-700/50 text-green-300 rounded px-3 py-1 hover:bg-green-900/50"
                      >
                        {D.APP_ACCEPT}
                      </button>
                      <button
                        onClick={() => respondToApplication.mutate({ appId: a.id, accept: false })}
                        className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500"
                      >
                        {D.APP_DECLINE}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => withdrawApplication.mutate({ appId: a.id })}
                      className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500"
                    >
                      {D.APP_WITHDRAW}
                    </button>
                  )
                ) : (
                  <span className="text-xs text-gray-500">{a.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** Team Manager panel: list managed teams + create a new one. */
const TeamManagerPanel = ({ rating, userId }) => {
  const navigate = useNavigate();
  const { data: teams = [] } = useMyTeams(userId);
  const { createTeam } = useTeamMutations();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', tag: '' });
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const team = await createTeam.mutateAsync({ managerId: userId, name: form.name, tag: form.tag });
      navigate(`/team/${team.id}`);
    } catch (err) {
      setError(err.message || APP_CONSTANTS.TEAM_MGMT.ERROR);
    }
  };

  return (
    <div className="rtr-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">
          <i className={`fas ${APP_CONSTANTS.ROLE_ICONS.team_manager} mr-2 text-indigo-300`}></i>
          {D.TEAM_MANAGER_TITLE}
        </h3>
        <RatingBadge value={rating} />
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-gray-400">{D.TEAM_MANAGER_EMPTY}</p>
      ) : (
        <div className="space-y-2">
          {teams.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
              <div className="flex-grow">
                <span className="text-white font-medium">{t.name}</span>
                {t.tag && <span className="text-gray-500 text-sm ml-2">[{t.tag}]</span>}
                <div className="text-xs text-gray-500">
                  {t.memberCount} {D.TEAM_MEMBERS_COUNT}
                  {t.pendingCount > 0 && (
                    <span className="ml-2 text-amber-300">· {t.pendingCount} {D.TEAM_PENDING_APPS}</span>
                  )}
                </div>
              </div>
              <RatingBadge value={t.rating} />
              <Link to={`/team/${t.id}`} className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500">
                {D.TEAM_MANAGE}
              </Link>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

      {creating ? (
        <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
          <input
            autoFocus
            required
            className="flex-grow bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            placeholder={APP_CONSTANTS.TEAM_MGMT.NAME_LABEL}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="w-24 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            placeholder={APP_CONSTANTS.TEAM_MGMT.TAG_LABEL}
            value={form.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
          />
          <button type="submit" disabled={createTeam.isPending} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 disabled:opacity-50">
            {createTeam.isPending ? APP_CONSTANTS.TEAM_MGMT.CREATING : APP_CONSTANTS.TEAM_MGMT.CREATE}
          </button>
        </form>
      ) : (
        <button onClick={() => setCreating(true)} className="mt-4 text-sm rtr-btn-primary inline-flex">
          <i className="fas fa-plus mr-2"></i>{D.TEAM_MANAGER_CREATE}
        </button>
      )}
    </div>
  );
};

/** Scaffold panel for roles not yet built out. */
const ScaffoldPanel = ({ title, body, soon, rating, icon }) => (
  <div className="rtr-card">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-white">
        {icon && <i className={`fas ${icon} mr-2 text-indigo-300`}></i>}
        {title}
      </h3>
      <RatingBadge value={rating} />
    </div>
    <p className="text-sm text-gray-400">{body}</p>
    <ComingSoon text={soon} />
  </div>
);

/** Dispatches to the right panel for one of the user's roles. */
const RolePanel = ({ role, profile, userId }) => {
  const rating = profile?.ratings?.find((r) => r.subject_type === role)?.rating;

  if (role === 'player') return <PlayerPanel profile={profile} rating={rating} userId={userId} />;
  if (role === 'team_manager') return <TeamManagerPanel rating={rating} userId={userId} />;

  const map = {
    coach: { title: D.COACH_TITLE, body: D.COACH_BODY, soon: D.COACH_SOON },
    scout: { title: D.SCOUT_TITLE, body: D.SCOUT_BODY, soon: D.SCOUT_SOON },
    tournament_manager: {
      title: D.TOURNAMENT_MANAGER_TITLE,
      body: D.TOURNAMENT_MANAGER_BODY,
      soon: D.TOURNAMENT_MANAGER_SOON,
    },
  };
  const m = map[role];
  if (!m) return null;
  return <ScaffoldPanel {...m} rating={rating} icon={APP_CONSTANTS.ROLE_ICONS[role]} />;
};

/** One row in the left dashboard rail. Renders a Link or a toggle button. */
const NavItem = ({ icon, label, active, accent, onClick, to }) => {
  const base =
    'relative flex items-center gap-3 w-full h-11 rounded-xl px-3 transition-colors justify-center sm:justify-start';
  const state = active
    ? 'text-indigo-300 bg-indigo-500/15'
    : accent
      ? 'text-amber-300 hover:text-amber-200 hover:bg-gray-800'
      : 'text-slate-400 hover:text-white hover:bg-gray-800';
  const inner = (
    <>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-indigo-400" />}
      <i className={`fas ${icon} text-lg w-5 text-center shrink-0`} />
      <span className="hidden sm:inline text-sm font-medium truncate">{label}</span>
    </>
  );
  return to ? (
    <Link to={to} title={label} className={`${base} ${state}`}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} title={label} className={`${base} ${state}`}>{inner}</button>
  );
};

/**
 * Role-aware dashboard. A left icon rail lists the sections relevant to the
 * user (Overview + each of their roles); admins can preview every role. The
 * Admin and Edit-profile shortcuts link out.
 */
const Dashboard = () => {
  const { user, roles, isAuthenticated, isLoading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [active, setActive] = useState('overview');

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.isAdmin;
  // Regular users only see their own roles; admins may preview any role.
  const navRoles = isAdmin ? ALL_ROLES : roles;
  // Guard against an active role that's no longer available.
  const current = active !== 'overview' && navRoles.includes(active) ? active : 'overview';
  const sectionTitle = current === 'overview' ? D.OVERVIEW : APP_CONSTANTS.ROLES[current];
  const shownRoles = current === 'overview' ? roles : [current];

  return (
    <div className="flex gap-4 sm:gap-6 animate-fade-in">
      {/* Left rail */}
      <nav className="flex flex-col items-center gap-1 w-14 sm:w-52 bg-[#111111] border border-gray-800/80 rounded-2xl p-2 sticky top-20 self-start shrink-0">
        <NavItem icon="fa-gauge-high" label={D.OVERVIEW} active={current === 'overview'} onClick={() => setActive('overview')} />
        {navRoles.length > 0 && <div className="my-1 h-px w-full bg-gray-800" />}
        {navRoles.map((r) => (
          <NavItem
            key={r}
            icon={APP_CONSTANTS.ROLE_ICONS[r]}
            label={APP_CONSTANTS.ROLES[r]}
            active={current === r}
            onClick={() => setActive(r)}
          />
        ))}
        <div className="my-1 h-px w-full bg-gray-800" />
        {isAdmin && <NavItem icon="fa-shield-halved" label={APP_CONSTANTS.NAV.ADMIN} accent to="/admin" />}
        <NavItem icon="fa-user-pen" label={D.EDIT_PROFILE} to="/profile/edit" />
      </nav>

      {/* Content */}
      <div className="flex-grow min-w-0 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{D.TITLE}</h1>
          <p className="text-gray-400">{sectionTitle}</p>
        </div>

        {shownRoles.length === 0 ? (
          <div className="rtr-card text-center py-10">
            <h3 className="text-lg font-semibold text-white">{D.NO_ROLES_TITLE}</h3>
            <p className="text-gray-400 mt-1 mb-4">{D.NO_ROLES_BODY}</p>
            <Link to="/onboarding" className="rtr-btn-primary">{D.SET_UP_PROFILE}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {shownRoles.map((role) => (
              <RolePanel key={role} role={role} profile={profile} userId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
