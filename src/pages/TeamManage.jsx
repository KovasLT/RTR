import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeam, useTeamMutations } from '../hooks/useTeams.js';
import { useDirectory } from '../hooks/useProfiles.js';
import { useRegions } from '../hooks/useReferenceData.js';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

const T = APP_CONSTANTS.TEAM_MGMT;
const inputClass =
  'w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500';

const STATUS_OPTIONS = [
  { value: 'recruiting', label: T.STATUS_RECRUITING },
  { value: 'active', label: T.STATUS_ACTIVE },
  { value: 'inactive', label: T.STATUS_INACTIVE },
];

const personName = (p) => p?.display_name || p?.handle || 'Unknown';

const TeamManage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: team, isLoading, refetch } = useTeam(id);
  const { data: regions = [] } = useRegions();
  const {
    updateTeam,
    updateMember,
    invitePlayer,
    applyToTeam,
    respondToApplication,
    removeMember,
    addStaff,
    removeStaff,
  } = useTeamMutations();

  const [recentMatches, setRecentMatches] = useState([]);
  const [tournamentPlacements, setTournamentPlacements] = useState([]);
  const [winRate, setWinRate] = useState(null);
  const [avgPlayerRating, setAvgPlayerRating] = useState(null);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!team) return;
    const fetchTeamStats = async () => {
      setLoadingExtra(true);
      try {
        const { data: matches } = await supabase
          .from('matches')
          .select(`
            id, match_date, score_team_a, score_team_b, status,
            team_a:teams!team_a_id(name, tag),
            team_b:teams!team_b_id(name, tag)
          `)
          .or(`team_a_id.eq.${team.id},team_b_id.eq.${team.id}`)
          .eq('status', 'confirmed')
          .order('match_date', { ascending: false })
          .limit(3);
        setRecentMatches(matches || []);

        const { data: placements } = await supabase
          .from('tournament_teams')
          .select(`
            placement,
            tournament:tournaments(title, start_date, end_date)
          `)
          .eq('team_id', team.id)
          .not('placement', 'is', null)
          .order('placement', { ascending: true });
        setTournamentPlacements(placements || []);

        const { data: allMatches } = await supabase
          .from('matches')
          .select('score_team_a, score_team_b, team_a_id, team_b_id')
          .or(`team_a_id.eq.${team.id},team_b_id.eq.${team.id}`)
          .eq('status', 'confirmed');
        if (allMatches && allMatches.length) {
          let wins = 0;
          allMatches.forEach(m => {
            const isTeamA = m.team_a_id === team.id;
            const teamScore = isTeamA ? m.score_team_a : m.score_team_b;
            const oppScore = isTeamA ? m.score_team_b : m.score_team_a;
            if (teamScore > oppScore) wins++;
          });
          setWinRate(Math.round((wins / allMatches.length) * 100));
        } else setWinRate(null);

        if (team.members && team.members.length) {
          const memberIds = team.members.map(m => m.user_id);
          const { data: ratings } = await supabase
            .from('ratings')
            .select('subject_id, rating')
            .eq('subject_type', 'player')
            .in('subject_id', memberIds);
          if (ratings && ratings.length) {
            const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
            setAvgPlayerRating(Math.round(sum / ratings.length));
          } else setAvgPlayerRating(null);
        } else setAvgPlayerRating(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExtra(false);
      }
    };
    fetchTeamStats();
  }, [team]);

  useEffect(() => {
    if (!team) return;
    let active = true;
    (async () => {
      if (!active) return;
      setForm({
        name: team.name || '',
        tag: team.tag || '',
        logoUrl: team.logo_url || '',
        regionId: team.region?.id ? String(team.region.id) : '',
        status: team.status || 'recruiting',
        recruitmentNote: team.recruitment_note || '',
      });
    })();
    return () => { active = false; };
  }, [team]);

  const memberIds = useMemo(() => new Set((team?.members ?? []).map((m) => m.user_id)), [team]);
  const pendingInviteeIds = useMemo(
    () => new Set((team?.applications ?? []).filter((a) => a.status === 'pending').map((a) => a.applicant_id)),
    [team]
  );

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!team) return <div className="text-center text-gray-400 py-16">{T.ERROR}</div>;

  const isManager = isAuthenticated && team.manager_id === user?.id;
  const isMember = memberIds.has(user?.id);
  const hasPendingForMe = (team.applications ?? []).some(
    (a) => a.applicant_id === user?.id && a.status === 'pending'
  );
  const pendingApplies = (team.applications ?? []).filter(
    (a) => a.status === 'pending' && a.type === 'apply'
  );

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const act = async (fn) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message || T.ERROR);
    }
  };

  const saveDetails = (e) => {
    e.preventDefault();
    act(() =>
      updateTeam.mutateAsync({
        id: team.id,
        patch: {
          name: form.name,
          tag: form.tag || null,
          logo_url: form.logoUrl || null,
          region_id: form.regionId ? Number(form.regionId) : null,
          status: form.status,
          recruitment_note: form.recruitmentNote || null,
        },
      })
    );
  };

  const getMatchResult = (match) => {
    const isTeamA = match.team_a_id === team.id;
    const teamScore = isTeamA ? match.score_team_a : match.score_team_b;
    const oppScore = isTeamA ? match.score_team_b : match.score_team_a;
    const opponentName = isTeamA ? match.team_b?.name : match.team_a?.name;
    const result = teamScore > oppScore ? 'Win' : teamScore === oppScore ? 'Draw' : 'Loss';
    return { result, teamScore, oppScore, opponentName };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="rtr-card flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {team.name}
            {team.tag && <span className="text-gray-500 text-xl ml-2">[{team.tag}]</span>}
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px] px-2 py-0.5 rounded font-bold tracking-wider">
              {team.region?.code || '—'}
            </span>
            <span className="text-gray-400">{APP_CONSTANTS.TEAMS.STATUS[team.status] || team.status}</span>
            <span className="text-indigo-300 font-mono font-bold">Rating: {team.rating ?? 1200}</span>
          </div>
          {team.recruitment_note && (
            <div className="mt-3 text-sm text-gray-300 border-l-2 border-indigo-500 pl-3">
              {team.recruitment_note}
            </div>
          )}
        </div>
        <div>
          {isAuthenticated && !isManager ? (
            isMember ? (
              <span className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 px-5 py-2 rounded-full text-sm font-medium">
                <i className="fas fa-check-circle"></i> Member
              </span>
            ) : hasPendingForMe ? (
              <span className="inline-flex items-center gap-2 bg-yellow-600/20 text-yellow-400 px-5 py-2 rounded-full text-sm font-medium">
                <i className="fas fa-clock"></i> Pending
              </span>
            ) : team.status === 'recruiting' ? (
              <button
                onClick={() => act(() => applyToTeam.mutateAsync({ teamId: team.id, applicantId: user.id }))}
                disabled={applyToTeam.isPending}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg"
              >
                <i className="fas fa-hand-peace"></i>
                {applyToTeam.isPending ? 'Applying...' : 'Join team'}
              </button>
            ) : (
              <span className="text-gray-500 text-sm">Not recruiting</span>
            )
          ) : isManager && (
            <span className="text-indigo-400 text-sm bg-indigo-950/30 px-4 py-2 rounded-full">Manager</span>
          )}
        </div>
      </div>

      {!loadingExtra && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{winRate !== null ? `${winRate}%` : '—'}</div>
            <div className="text-xs text-gray-400">Win rate</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{tournamentPlacements.length}</div>
            <div className="text-xs text-gray-400">Tournaments</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{avgPlayerRating !== null ? avgPlayerRating : '—'}</div>
            <div className="text-xs text-gray-400">Avg player rating</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{team.rating ?? 1200}</div>
            <div className="text-xs text-gray-400">Team rating</div>
          </div>
        </div>
      )}

      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <i className="fas fa-clock text-indigo-300"></i> Recent matches
        </h3>
        {loadingExtra ? (
          <div className="text-sm text-gray-400">Loading matches...</div>
        ) : recentMatches.length === 0 ? (
          <div className="text-sm text-gray-400">No matches recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {recentMatches.map(m => {
              const { result, teamScore, oppScore, opponentName } = getMatchResult(m);
              const resultColor = result === 'Win' ? 'text-green-400' : result === 'Loss' ? 'text-red-400' : 'text-yellow-400';
              return (
                <div key={m.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <div>
                    <span className="text-white font-medium">{opponentName}</span>
                    <div className="text-xs text-gray-500">{m.match_date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold ${resultColor}`}>{result}</span>
                    <span className="text-white font-mono">{teamScore} – {oppScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loadingExtra && tournamentPlacements.length > 0 && (
        <div className="rtr-card">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <i className="fas fa-trophy text-yellow-400"></i> Achievements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tournamentPlacements.map((p, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-800/30 p-2 rounded">
                <span className="text-2xl">
                  {p.placement === 1 ? '🥇' : p.placement === 2 ? '🥈' : p.placement === 3 ? '🥉' : '🏅'}
                </span>
                <div>
                  <div className="text-white font-medium">{p.tournament?.title || 'Unknown tournament'}</div>
                  <div className="text-xs text-gray-400">Placement: #{p.placement}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rtr-card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <i className="fas fa-users text-indigo-300"></i> Roster
            </h3>
            <span className="text-sm text-gray-500">{team.members.length} players</span>
          </div>
          {team.members.length === 0 ? (
            <p className="text-sm text-gray-400">{T.ROSTER_EMPTY}</p>
          ) : (
            <div className="space-y-2">
              {team.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg">
                  <div>
                    <Link to={`/profile/${m.user_id}`} className="text-white font-medium hover:underline">
                      {personName(m.profile)}
                      {m.is_captain && (
                        <span className="ml-2 text-[10px] bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded">Captain</span>
                      )}
                    </Link>
                    <div className="text-xs text-gray-500">{m.lane?.name || 'No lane'}</div>
                  </div>
                  {isManager && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(() => updateMember.mutateAsync({ teamId: team.id, userId: m.user_id, patch: { is_captain: !m.is_captain } }))}
                        className="text-xs text-gray-300 hover:text-indigo-300"
                      >
                        {m.is_captain ? 'Revoke captain' : 'Make captain'}
                      </button>
                      <button
                        onClick={() => act(() => removeMember.mutateAsync({ teamId: team.id, userId: m.user_id }))}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {isManager && !memberIds.has(user.id) && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <button
                onClick={() => act(() => updateMember.mutateAsync({ teamId: team.id, userId: user.id, patch: { lane_id: null, is_captain: false } }))}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <i className="fas fa-user-plus"></i> Add myself as player
              </button>
            </div>
          )}
        </div>

        <div className="rtr-card">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <i className="fas fa-chalkboard-user text-indigo-300"></i> Staff
          </h3>
          {(team.staff ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">{T.STAFF_EMPTY}</p>
          ) : (
            <div className="space-y-2">
              {team.staff.map((s) => (
                <div key={s.user_id} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg">
                  <div>
                    <span className="text-xs uppercase bg-gray-700 text-indigo-300 px-2 py-0.5 rounded">
                      {T.STAFF_ROLES[s.role] || s.role}
                    </span>
                    <Link to={`/profile/${s.user_id}`} className="ml-2 text-white font-medium hover:underline">
                      {personName(s.profile)}
                    </Link>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => act(() => removeStaff.mutateAsync({ teamId: team.id, userId: s.user_id }))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {isManager && (
            <AddStaff
              existingIds={new Set((team.staff ?? []).map((s) => s.user_id))}
              onAdd={(userId, role) => act(() => addStaff.mutateAsync({ teamId: team.id, userId, role }))}
            />
          )}
        </div>
      </div>

      {isManager && (
        <>
          <div className="rtr-card">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-inbox text-amber-300"></i> Pending applications
            </h3>
            {pendingApplies.length === 0 ? (
              <p className="text-sm text-gray-400">No applications</p>
            ) : (
              <div className="space-y-2">
                {pendingApplies.map((a) => (
                  <div key={a.id} className="flex flex-wrap justify-between items-center border-b border-gray-800 pb-2">
                    <div>
                      <Link to={`/profile/${a.applicant_id}`} className="text-white font-medium">
                        {personName(a.applicant)}
                      </Link>
                      {a.message && <p className="text-xs text-gray-400 mt-1">“{a.message}”</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(() => respondToApplication.mutateAsync({ appId: a.id, accept: true }))}
                        className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => act(() => respondToApplication.mutateAsync({ appId: a.id, accept: false }))}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <InvitePlayers
            search={search}
            setSearch={setSearch}
            excludeIds={memberIds}
            invitedIds={pendingInviteeIds}
            managerId={user?.id}
            onInvite={(applicantId) => act(() => invitePlayer.mutateAsync({ teamId: team.id, applicantId }))}
          />

          {form && (
            <form onSubmit={saveDetails} className="rtr-card space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <i className="fas fa-gear text-indigo-300"></i> Team settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Team name</label>
                  <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tag</label>
                  <input className={inputClass} value={form.tag} onChange={(e) => set('tag', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Region</label>
                  <select className={inputClass} value={form.regionId} onChange={(e) => set('regionId', e.target.value)}>
                    <option value="">-- Select region --</option>
                    {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Recruitment note</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="What are you looking for in new members?"
                    value={form.recruitmentNote}
                    onChange={(e) => set('recruitmentNote', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Logo URL</label>
                  <input className={inputClass} value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={updateTeam.isPending} className="rtr-btn-primary px-6">
                  {updateTeam.isPending ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

const InvitePlayers = ({ search, setSearch, excludeIds, invitedIds, managerId, onInvite }) => {
  const { data: people = [] } = useDirectory();
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter((p) => p.roles?.includes('player'))
      .filter((p) => p.id !== managerId && !excludeIds.has(p.id))
      .filter((p) => personName(p).toLowerCase().includes(q))
      .slice(0, 8);
  }, [people, search, excludeIds, managerId]);

  return (
    <div className="rtr-card">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <i className="fas fa-envelope-open-text text-indigo-300"></i> Invite players
      </h3>
      <input
        className={inputClass}
        placeholder="Search player by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-3 space-y-2">
        {results.length === 0 && search.trim() !== '' && (
          <p className="text-sm text-gray-500">No players found matching "{search}"</p>
        )}
        {results.map((p) => {
          const invited = invitedIds.has(p.id);
          return (
            <div key={p.id} className="flex items-center justify-between border-b border-gray-800 pb-2">
              <Link to={`/profile/${p.id}`} className="text-white font-medium hover:underline">
                {personName(p)}
              </Link>
              <button
                disabled={invited}
                onClick={() => onInvite(p.id)}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                {invited ? 'Invited' : 'Send invite'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STAFF_ROLE_OPTIONS = ['coach', 'scout', 'analyst'];
const AddStaff = ({ existingIds, onAdd }) => {
  const { data: people = [] } = useDirectory();
  const [role, setRole] = useState('coach');
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter((p) => (role === 'analyst' ? true : p.roles?.includes(role)))
      .filter((p) => !existingIds.has(p.id))
      .filter((p) => personName(p).toLowerCase().includes(q))
      .slice(0, 8);
  }, [people, role, search, existingIds]);

  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <h4 className="text-sm font-semibold text-white mb-2">Add staff</h4>
      <div className="flex flex-wrap gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
        >
          {STAFF_ROLE_OPTIONS.map((r) => (<option key={r} value={r}>{T.STAFF_ROLES[r]}</option>))}
        </select>
        <input
          className="flex-grow bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="mt-3 space-y-2">
        {results.length === 0 && search.trim() !== '' && (
          <p className="text-sm text-gray-500">No users found</p>
        )}
        {results.map((p) => (
          <div key={p.id} className="flex items-center justify-between border-b border-gray-800 pb-2">
            <Link to={`/profile/${p.id}`} className="text-white font-medium hover:underline">
              {personName(p)}
            </Link>
            <button
              onClick={() => onAdd(p.id, role)}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded"
            >
              Add as {T.STAFF_ROLES[role]}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamManage;