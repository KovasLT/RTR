import { useState, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile, useDirectory, useRatingHistory, usePlayerMutations } from '../hooks/useProfiles.js';
import {
  useMyTeams,
  useMyApplications,
  useMyMemberships,
  useRecruitingTeams,
  useMyStaffTeams,
  useTeamMutations,
} from '../hooks/useTeams.js';
import { useScoutsWatchingMe, useMyWatchlist, useScoutMutations } from '../hooks/useScouting.js';
import { useEndorsements } from '../hooks/useEndorsements.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';
import Sparkline from '../components/Sparkline';
import ReportMatch from '../pages/ReportMatch';
import TournamentManagerPanel from '../components/TournamentManagerPanel'; 
import FindScrims from './FindScrims';
import RecentMatches from '../components/RecentMatches';
import RecentSignings from '../components/RecentSignings';
import RecentScrims from '../components/RecentScrims';
import RecentPlacements from '../components/RecentPlacements';
import NewsFeed from '../components/NewsFeed';

const REASON = APP_CONSTANTS.DASHBOARD.RATING_REASONS;

/** Reusable recent-activity card from a rating-event list (oldest → newest). */
const ActivityCard = ({ events }) => {
  const recent = [...events].reverse().slice(0, 8);
  return (
    <div className="rtr-card">
      <h3 className="text-lg font-semibold text-white mb-2">{APP_CONSTANTS.DASHBOARD.PLAYER_ACTIVITY_TITLE}</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400">{APP_CONSTANTS.DASHBOARD.PLAYER_ACTIVITY_EMPTY}</p>
      ) : (
        <div className="space-y-2">
          {recent.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-sm border-b border-gray-800 pb-2 last:border-0">
              <span className={`font-mono font-bold w-12 shrink-0 ${e.delta > 0 ? 'text-green-400' : e.delta < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                {e.delta > 0 ? `+${e.delta}` : e.delta}
              </span>
              <span className="text-gray-300 flex-grow">{REASON[e.reason] || e.reason}</span>
              <span className="text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

/** Player panel: overview + my teams + applications/invites. */
const PlayerPanel = ({ profile, rating, userId }) => {
  const p = profile?.player;
  const { data: apps = [] } = useMyApplications(userId);
  const { data: teams = [] } = useMyMemberships(userId);
  const { data: history = [] } = useRatingHistory('player', userId);
  const { data: watchers = [] } = useScoutsWatchingMe(userId);
  const { data: recruiting = [] } = useRecruitingTeams();
  const { respondToApplication, withdrawApplication, applyToTeam } = useTeamMutations();
  const { setLookingForTeam } = usePlayerMutations();
  const heroPool = Array.isArray(p?.hero_pool) ? p.hero_pool : [];

  const myTeamIds = new Set(teams.map((t) => t.teamId));
  const appliedIds = new Set(apps.filter((a) => a.status === 'pending').map((a) => a.team_id));
  const myRegionId = profile?.region?.id ?? null;
  const recommended = recruiting
    .filter((t) => !myTeamIds.has(t.id) && !appliedIds.has(t.id))
    .sort((a, b) => Number(b.regionId === myRegionId) - Number(a.regionId === myRegionId))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Overview */}
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
        {heroPool.length > 0 && (
          <div className="mt-4">
            <div className="text-gray-500 text-sm mb-1">{D.PLAYER_HERO_POOL}</div>
            <div className="flex flex-wrap gap-1.5">
              {heroPool.map((h) => (
                <span key={String(h)} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-0.5">{String(h)}</span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`text-sm ${p?.looking_for_team ? 'text-green-400' : 'text-gray-400'}`}>
            <i className={`fas ${p?.looking_for_team ? 'fa-search' : 'fa-circle-pause'} mr-2`}></i>
            {p?.looking_for_team ? D.PLAYER_LFT_ON : D.PLAYER_LFT_OFF}
          </span>
          <button
            onClick={() => setLookingForTeam.mutate({ userId, value: !p?.looking_for_team })}
            disabled={setLookingForTeam.isPending}
            className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500 disabled:opacity-50"
          >
            {p?.looking_for_team ? D.PLAYER_LFT_UNSET : D.PLAYER_LFT_SET}
          </button>
        </div>
      </div>

      <div className="rtr-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{D.PLAYER_RATING_HISTORY}</h3>
          {history.length > 0 && (
            <div className="text-xs text-gray-400 flex gap-4">
              <span>{D.PLAYER_CURRENT}: <span className="text-indigo-300 font-mono font-bold">{history[history.length - 1].new_rating}</span></span>
              <span>{D.PLAYER_PEAK}: <span className="text-indigo-300 font-mono font-bold">{Math.max(...history.map((h) => h.new_rating))}</span></span>
            </div>
          )}
        </div>
        {history.length < 2 ? (
          <p className="text-sm text-gray-400">{D.PLAYER_RATING_HISTORY_EMPTY}</p>
        ) : (
          <Sparkline values={history.map((h) => h.new_rating)} width={400} height={56} className="w-full h-14" />
        )}
      </div>

      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-3">{D.PLAYER_TEAMS_TITLE}</h3>
        {teams.length === 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-400">{D.PLAYER_TEAMS_EMPTY}</p>
            <Link to="/teams" className="text-sm text-indigo-300 hover:text-indigo-200 font-medium">
              <i className="fas fa-magnifying-glass mr-1.5"></i>{D.PLAYER_FIND_TEAM}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <div key={t.teamId} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
                <div className="flex-grow min-w-0">
                  <Link to={`/team/${t.teamId}`} className="text-white font-medium hover:underline">
                    {t.name}
                  </Link>
                  {t.tag && <span className="text-gray-500 text-sm ml-2">[{t.tag}]</span>}
                  <div className="text-xs text-gray-500">
                    {t.lane || '—'}
                    {t.isCaptain && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide font-semibold bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 rounded px-1.5 py-0.5">
                        {D.PLAYER_CAPTAIN}
                      </span>
                    )}
                  </div>
                </div>
                {t.regionCode && (
                  <span className="bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">
                    {t.regionCode}
                  </span>
                )}
                <RatingBadge value={t.rating} />
                <Link to={`/team/${t.teamId}`} className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500">
                  {D.PLAYER_VIEW_TEAM}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <ActivityCard events={history} />
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
      console.error("Database submission failed:", err); 
      setError(err?.message || APP_CONSTANTS.TEAM_MGMT.ERROR || "An unexpected error occurred while creating the team.");
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

/** Scout panel: the scout's watchlist + a search to add players. */
const ScoutPanel = ({ rating, userId }) => {
  const { data: list = [] } = useMyWatchlist(userId);
  const { unwatch } = useScoutMutations();

  return (
    <div className="space-y-4">
      <div className="rtr-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            <i className={`fas ${APP_CONSTANTS.ROLE_ICONS.scout} mr-2 text-indigo-300`}></i>
            {D.SCOUT_WATCHLIST_TITLE}
          </h3>
          <RatingBadge value={rating} />
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-gray-400">{D.SCOUT_WATCHLIST_EMPTY}</p>
        ) : (
          <div className="space-y-2">
            {list.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
                <Link to={`/profile/${w.playerId}`} className="text-white font-medium hover:underline flex-grow">{w.name}</Link>
                <span className="text-xs text-gray-500">{w.lane || '—'}{w.rank ? ` · ${w.rank}` : ''}</span>
                <RatingBadge value={w.rating} />
                <button
                  onClick={() => unwatch.mutate({ scoutId: userId, playerId: w.playerId })}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  {D.SCOUT_REMOVE}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScoutAddPlayer scoutId={userId} existingIds={new Set(list.map((w) => w.playerId))} />
    </div>
  );
};

const ScoutAddPlayer = ({ scoutId, existingIds }) => {
  const { data: people = [] } = useDirectory();
  const { watch } = useScoutMutations();
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter((p) => p.roles.includes('player'))
      .filter((p) => p.id !== scoutId && !existingIds.has(p.id))
      .filter((p) => (p.display_name || p.handle || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [people, search, existingIds, scoutId]);

  return (
    <div className="rtr-card">
      <h3 className="text-lg font-semibold text-white mb-3">{D.SCOUT_ADD_TITLE}</h3>
      <input
        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
        placeholder={D.SCOUT_SEARCH}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-3 space-y-2">
        {results.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
            <Link to={`/profile/${p.id}`} className="text-white font-medium hover:underline flex-grow">
              {p.display_name || p.handle}
            </Link>
            <button
              onClick={() => watch.mutate({ scoutId, playerId: p.id })}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1"
            >
              {D.SCOUT_WATCH}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CoachPanel = ({ profile, rating, userId }) => {
  const c = profile?.coach;
  const { data: teams = [] } = useMyStaffTeams(userId, 'coach');
  const { data: history = [] } = useRatingHistory('coach', userId);
  const { data: endorsements = [] } = useEndorsements(userId);
  const endorseCount = endorsements.filter((e) => e.subject_type === 'coach').length;

  return (
    <div className="space-y-4">
      <div className="rtr-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            <i className={`fas ${APP_CONSTANTS.ROLE_ICONS.coach} mr-2 text-indigo-300`}></i>
            {D.COACH_TITLE}
          </h3>
          <RatingBadge value={rating} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">{D.COACH_SPECIALTIES}</div>
            <div className="text-white">{c?.specialties || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{D.COACH_EXPERIENCE}</div>
            <div className="text-white">{c?.experience_years != null ? `${c.experience_years} ${D.COACH_YEARS}` : '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{D.COACH_AVAILABILITY}</div>
            <div className="text-white">{c?.availability || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{D.COACH_ENDORSEMENTS}</div>
            <div className="text-white"><i className="fas fa-thumbs-up text-indigo-300 mr-1"></i>{endorseCount}</div>
          </div>
        </div>
      </div>
      <ActivityCard events={history} />
    </div>
  );
};

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

const RolePanel = ({ role, profile, userId }) => {
  const rating = profile?.ratings?.find((r) => r.subject_type === role)?.rating;

  if (role === 'player') return <PlayerPanel profile={profile} rating={rating} userId={userId} />;
  if (role === 'team_manager') return <TeamManagerPanel rating={rating} userId={userId} />;
  if (role === 'scout') return <ScoutPanel rating={rating} userId={userId} />;
  if (role === 'coach') return <CoachPanel profile={profile} rating={rating} userId={userId} />;
  if (role === 'tournament_manager') return <TournamentManagerPanel rating={rating} userId={userId} />;

  return null;
};

const NavItem = ({ icon, label, active, accent, badge = 0, onClick, to }) => {
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
      {badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-indigo-500 text-white">
          {badge}
        </span>
      )}
    </>
  );
  return to ? (
    <Link to={to} title={label} className={`${base} ${state}`}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} title={label} className={`${base} ${state}`}>{inner}</button>
  );
};

const Dashboard = () => {
  const { user, roles, isAuthenticated, isLoading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: myApps = [] } = useMyApplications(user?.id);
  const { data: myManagedTeams = [] } = useMyTeams(user?.id);
  const [active, setActive] = useState('overview');

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.isAdmin;
  const navRoles = isAdmin ? ALL_ROLES : roles;
  const inviteCount = myApps.filter((a) => a.status === 'pending' && a.type === 'invite').length;
  const managerPending = myManagedTeams.reduce((n, t) => n + (t.pendingCount || 0), 0);
  const badgeFor = (r) => (r === 'player' ? inviteCount : r === 'team_manager' ? managerPending : 0);
  const isCustomAction = ['report-match', 'scrims'].includes(active);
  const current = (active === 'overview' || isCustomAction || navRoles.includes(active)) ? active : 'overview';

  const sectionTitle = current === 'overview' 
    ? D.OVERVIEW 
    : current === 'report-match'
      ? 'Report Match'
      : current === 'scrims'
        ? 'Find Scrims'
        : APP_CONSTANTS.ROLES[current];

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
            badge={badgeFor(r)}
            onClick={() => setActive(r)}
          />
        ))}
        <div className="my-1 h-px w-full bg-gray-800" />
        {isAdmin && <NavItem icon="fa-shield-halved" label={APP_CONSTANTS.NAV.ADMIN} accent to="/admin" />}
        {/* <NavItem icon="fa-user-pen" label={D.EDIT_PROFILE} to="/profile/edit" /> */}
        <div className="my-2 h-px w-full bg-gray-800/60" />
        
        <span className="hidden sm:block text-[10px] font-bold text-gray-500 uppercase tracking-wider self-start px-3 my-1">
          {APP_CONSTANTS.NAV.QUICK_ACTIONS_TITLE}
        </span>
	<NavItem icon="fa-trophy" label="Tournaments" to="/tournaments" />

        <NavItem 
          icon="fa-khanda" 
          label={APP_CONSTANTS.NAV.REPORT_MATCH} 
          active={current === 'report-match'}
          onClick={() => setActive('report-match')} 
        />
        
        <NavItem 
          icon="fa-satellite-dish" 
          label={APP_CONSTANTS.NAV.LOOK_FOR_SCRIMS} 
          active={current === 'scrims'}
          onClick={() => setActive('scrims')} 
        />
      </nav>

      {/* Content */}
      <div className="flex-grow min-w-0 space-y-6">
        
        <div className="mb-2">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {D.TITLE} {current !== 'overview' && <span className="mx-2">/</span>} {current !== 'overview' && sectionTitle}
          </div>
          {current === 'overview' && (
            <h2 className="text-3xl font-bold text-white">{sectionTitle}</h2>
          )}
        </div>

        {/* 1. Overview Tab */}
        {current === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
	      <div className="rtr-card">
                <h3 className="text-lg font-semibold text-white mb-3">⚔️ Recent Matches</h3>
                <RecentMatches limit={3} />
              </div>
              <div className="rtr-card">
                <h3 className="text-lg font-semibold text-white mb-3">🏆 Recent Tournament Placements</h3>
                <RecentPlacements limit={10} />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div className="rtr-card">
                <h3 className="text-lg font-semibold text-white mb-3">🔍 Looking for Scrims</h3>
                <RecentScrims limit={3} />
              </div>
              <div className="rtr-card">
                <h3 className="text-lg font-semibold text-white mb-3">➕ Recent Signings</h3>
                <RecentSignings limit={10} />
              </div>
            </div>
          </div>
        )}

        {/* 2. Report Match View */}
        {current === 'report-match' && (
          <ReportMatch userTeamId={profile?.team_id || profile?.managed_team_id || profile?.player?.team_id} />
        )}

        {/* 3. Look For Scrims View */}
        {current === 'scrims' && (
  <FindScrims />
	)}

        {/* 4. Fallback Role Panels */}
        {!['overview', 'report-match', 'scrims'].includes(current) && (
          shownRoles.length === 0 ? (
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
          )
        )}
      </div>
    </div>
  );
};

export default Dashboard;
