import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeam, useTeamMutations } from '../hooks/useTeams.js';
import { useDirectory } from '../hooks/useProfiles.js';
import { useRegions } from '../hooks/useReferenceData.js';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';
import Sparkline from '../components/Sparkline';

const T = APP_CONSTANTS.TEAM_MGMT;
const inputClass =
  'w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500';

const STATUS_OPTIONS = [
  { value: 'recruiting', label: T.STATUS_RECRUITING },
  { value: 'active', label: T.STATUS_ACTIVE },
  { value: 'inactive', label: T.STATUS_INACTIVE },
];

const personName = (p) => p?.display_name || p?.handle || 'Unknown';

const winProbability = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

const TeamManage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: team, isLoading, refetch } = useTeam(id);
  const { data: regions = [] } = useRegions();
  const {
    updateTeam,
    updateMember,
    addTeamMember,
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
  const [ratingHistory, setRatingHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [teamRank, setTeamRank] = useState(null);

  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  // Fetch team rank (global position)
  const fetchTeamRank = async () => {
    if (!team) return;
    const { count, error } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .gt('rating', team.rating ?? 1200);
    if (!error) setTeamRank((count || 0) + 1);
  };

  useEffect(() => {
    if (!team) return;
    const fetchTeamStats = async () => {
      setLoadingExtra(true);
      try {
        // Recent matches (only 3) – using approved/rejected
        const { data: matches } = await supabase
          .from('matches')
          .select(`
            id, created_at, match_info, match_type,
            score_team_a, score_team_b,
            team_a_rating_before, team_a_rating_after,
            team_b_rating_before, team_b_rating_after,
            team_a:teams!team_a_id(id, name, tag),
            team_b:teams!team_b_id(id, name, tag)
          `)
          .or(`team_a_id.eq.${team.id},team_b_id.eq.${team.id}`)
          .eq('approved', true)    // ✅ fixed
          .eq('rejected', false)   // ✅ fixed
          .order('created_at', { ascending: false })
          .limit(3);
        setRecentMatches(matches || []);

        // Tournament placements
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

        // Win rate from all matches – using approved/rejected
        const { data: allMatches } = await supabase
          .from('matches')
          .select('score_team_a, score_team_b, team_a_id, team_b_id')
          .or(`team_a_id.eq.${team.id},team_b_id.eq.${team.id}`)
          .eq('approved', true)    // ✅ fixed
          .eq('rejected', false);  // ✅ fixed
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

        // Average player rating
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

        // Rank
        await fetchTeamRank();
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExtra(false);
      }
    };
    fetchTeamStats();
  }, [team]);

  // Fetch rating history
  useEffect(() => {
    if (!team) return;
    const fetchRatingHistory = async () => {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('rating_events')
        .select('new_rating, created_at')
        .eq('subject_id', team.id)
        .eq('subject_type', 'team')
        .order('created_at', { ascending: true });
      if (!error && data) setRatingHistory(data);
      else setRatingHistory([]);
      setLoadingHistory(false);
    };
    fetchRatingHistory();
  }, [team]);

  // Initialize form when team loads
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
  const pendingApplies = (team?.applications ?? []).filter(
    (a) => a.status === 'pending' && a.type === 'apply'
  );

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!team) return <div className="text-center text-gray-400 py-16">{T.ERROR}</div>;

  const isManager = isAuthenticated && team.manager_id === user?.id;
  const isMember = memberIds.has(user?.id);
  const hasPendingForMe = (team.applications ?? []).some(
    (a) => a.applicant_id === user?.id && a.status === 'pending'
  );

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const act = async (fn) => {
    setError(null);
    try {
      await fn();
      refetch();
      if (team) await fetchTeamRank(); // update rank after changes
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
    setShowSettings(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header with logo, name, region, motto, status, rank (no rating duplicate) */}
      <div className="rtr-card flex flex-wrap gap-4 items-start">
        <div className="flex items-center gap-4">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <i className="fas fa-users text-2xl text-gray-500"></i>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{team.name}</h1>
              {team.tag && <span className="text-gray-500 text-lg">[{team.tag}]</span>}
              <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded-full">
                {team.region?.code || '?'}
              </span>
            </div>
            {team.recruitment_note && (
              <p className="text-sm text-gray-300 mt-1 italic">"{team.recruitment_note}"</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <span className="text-gray-400">{APP_CONSTANTS.TEAMS.STATUS[team.status] || team.status}</span>
              {teamRank !== null && (
                <span className="text-amber-400 font-mono font-bold">Rank: #{teamRank}</span>
              )}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated && !isManager ? (
            isMember ? (
              <span className="bg-green-600/20 text-green-400 px-4 py-1.5 rounded-full text-sm">Member</span>
            ) : hasPendingForMe ? (
              <span className="bg-yellow-600/20 text-yellow-400 px-4 py-1.5 rounded-full text-sm">Pending</span>
            ) : team.status === 'recruiting' ? (
              <button
                onClick={() => act(() => applyToTeam.mutateAsync({ teamId: team.id, applicantId: user.id }))}
                disabled={applyToTeam.isPending}
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-1.5 rounded-full font-semibold text-sm"
              >
                <i className="fas fa-hand-peace mr-1"></i> Join team
              </button>
            ) : (
              <span className="text-gray-500 text-sm">Not recruiting</span>
            )
          ) : isManager && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              <i className="fas fa-edit mr-1"></i> {showSettings ? 'Cancel' : 'Edit team'}
            </button>
          )}
        </div>
      </div>

      {/* Stats row (rating is here, not in header) */}
      {!loadingExtra && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800/40 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{winRate !== null ? `${winRate}%` : '—'}</div>
            <div className="text-[10px] text-gray-400">Win rate</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{tournamentPlacements.length}</div>
            <div className="text-[10px] text-gray-400">Tournaments</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{avgPlayerRating !== null ? avgPlayerRating : '—'}</div>
            <div className="text-[10px] text-gray-400">Avg player rating</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{team.rating ?? 1200}</div>
            <div className="text-[10px] text-gray-400">Team rating</div>
          </div>
        </div>
      )}

      {/* Edit form – appears right below stats when active */}
      {isManager && showSettings && form && (
        <form onSubmit={saveDetails} className="rtr-card space-y-3">
          <h3 className="text-md font-semibold text-white">Edit team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Team name</label>
              <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Tag</label>
              <input className={inputClass} value={form.tag} onChange={(e) => set('tag', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Region</label>
              <select className={inputClass} value={form.regionId} onChange={(e) => set('regionId', e.target.value)}>
                <option value="">-- Select region --</option>
                {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-1">Motto / Recruitment note</label>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="What is your team's motto or recruitment message?"
                value={form.recruitmentNote}
                onChange={(e) => set('recruitmentNote', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-1">Logo URL</label>
              <input className={inputClass} value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={updateTeam.isPending} className="rtr-btn-primary px-4 py-1.5 text-sm">
              {updateTeam.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Achievements */}
      {!loadingExtra && tournamentPlacements.length > 0 && (
        <div className="rtr-card">
          <h3 className="text-md font-semibold text-white mb-2">Achievements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tournamentPlacements.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-800/30 p-1.5 rounded">
                <span className="text-lg">{p.placement === 1 ? '🥇' : p.placement === 2 ? '🥈' : p.placement === 3 ? '🥉' : '🏅'}</span>
                <div>
                  <div className="text-white text-sm">{p.tournament?.title || 'Unknown tournament'}</div>
                  <div className="text-xs text-gray-400">#{p.placement}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating History – full width */}
      <div className="rtr-card">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-semibold text-white">Team Rating History</h3>
          {ratingHistory.length > 0 && (
            <div className="text-[10px] text-gray-400">
              Current: <span className="text-indigo-300 font-mono font-bold">{ratingHistory[ratingHistory.length - 1]?.new_rating || team.rating}</span>
              {ratingHistory.length > 1 && (
                <span className="ml-2">Peak: <span className="text-indigo-300 font-mono font-bold">
                  {Math.max(...ratingHistory.map(h => h.new_rating))}
                </span></span>
              )}
            </div>
          )}
        </div>
        {loadingHistory ? (
          <div className="text-xs text-gray-400">Loading...</div>
        ) : ratingHistory.length < 2 ? (
          <div className="text-xs text-gray-400">Not enough data yet – play more matches to see rating history.</div>
        ) : (
          <Sparkline values={ratingHistory.map(h => h.new_rating)} width={600} height={60} className="w-full h-16" />
        )}
      </div>

      {/* Side‑by‑side: Roster + Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roster */}
        <div className="rtr-card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-white">Roster</h3>
            <span className="text-xs text-gray-500">{team.members.length} players</span>
          </div>
          {team.members.length === 0 ? (
            <p className="text-xs text-gray-400">{T.ROSTER_EMPTY}</p>
          ) : (
            <div className="space-y-1.5">
              {team.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between bg-gray-800/30 p-2 rounded text-sm">
                  <div>
                    <Link to={`/profile/${m.user_id}`} className="text-white hover:text-indigo-300">
                      {personName(m.profile)}
                      {m.is_captain && <span className="ml-1 text-[9px] bg-amber-900/50 text-amber-300 px-1 py-0.5 rounded">C</span>}
                    </Link>
                    <div className="text-[10px] text-gray-500">{m.lane?.name || 'No lane'}</div>
                  </div>
                  {isManager && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => act(() => updateMember.mutateAsync({ teamId: team.id, userId: m.user_id, patch: { is_captain: !m.is_captain } }))}
                        className="text-[10px] text-gray-300 hover:text-indigo-300"
                      >
                        {m.is_captain ? 'Revoke' : 'Captain'}
                      </button>
                      <button
                        onClick={() => act(() => removeMember.mutateAsync({ teamId: team.id, userId: m.user_id }))}
                        className="text-[10px] text-red-400 hover:text-red-300"
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
            <div className="mt-3 pt-2 border-t border-gray-700">
              <button
                onClick={() => act(async () => {
                  await addTeamMember.mutateAsync({ teamId: team.id, userId: user.id, laneId: null, isCaptain: false });
                  refetch();
                })}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded"
              >
                <i className="fas fa-user-plus mr-1"></i> Add myself as player
              </button>
            </div>
          )}
        </div>

        {/* Staff */}
        <div className="rtr-card">
          <h3 className="text-md font-semibold text-white mb-2">Staff</h3>
          {(team.staff ?? []).length === 0 ? (
            <p className="text-xs text-gray-400">{T.STAFF_EMPTY}</p>
          ) : (
            <div className="space-y-1.5">
              {team.staff.map((s) => (
                <div key={s.user_id} className="flex items-center justify-between bg-gray-800/30 p-2 rounded text-sm">
                  <div>
                    <span className="text-[9px] uppercase bg-gray-700 text-indigo-300 px-1.5 py-0.5 rounded">
                      {T.STAFF_ROLES[s.role] || s.role}
                    </span>
                    <Link to={`/profile/${s.user_id}`} className="ml-2 text-white hover:text-indigo-300">
                      {personName(s.profile)}
                    </Link>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => act(() => removeStaff.mutateAsync({ teamId: team.id, userId: s.user_id }))}
                      className="text-[10px] text-red-400 hover:text-red-300"
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

      {/* Side‑by‑side: Pending Applications + Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isManager ? (
          <div className="rtr-card">
            <h3 className="text-md font-semibold text-white mb-2">Pending applications</h3>
            {pendingApplies.length === 0 ? (
              <p className="text-xs text-gray-400">No applications</p>
            ) : (
              <div className="space-y-1.5">
                {pendingApplies.map((a) => (
                  <div key={a.id} className="flex justify-between items-center border-b border-gray-800 pb-1">
                    <div>
                      <Link to={`/profile/${a.applicant_id}`} className="text-white text-sm">
                        {personName(a.applicant)}
                      </Link>
                      {a.message && <div className="text-[10px] text-gray-400">“{a.message.slice(0, 50)}”</div>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => act(() => respondToApplication.mutateAsync({ appId: a.id, accept: true }))}
                        className="text-[10px] bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => act(() => respondToApplication.mutateAsync({ appId: a.id, accept: false }))}
                        className="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rtr-card">
            <h3 className="text-md font-semibold text-white mb-2">Team info</h3>
            <p className="text-xs text-gray-400">Join this team to see more.</p>
          </div>
        )}

        <div className="rtr-card">
          <h3 className="text-md font-semibold text-white mb-2">Recent matches</h3>
          {loadingExtra ? (
            <div className="text-xs text-gray-400">Loading matches...</div>
          ) : recentMatches.length === 0 ? (
            <div className="text-xs text-gray-400">No matches recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map(m => {
                const ratingA = m.team_a_rating_before || 1200;
                const ratingB = m.team_b_rating_before || 1200;
                const winProbA = winProbability(ratingA, ratingB);
                const winProbPercentA = Math.round(winProbA * 100);
                const winProbPercentB = 100 - winProbPercentA;
                const deltaA = (m.team_a_rating_after || 0) - ratingA;
                const deltaB = (m.team_b_rating_after || 0) - ratingB;

                return (
                  <div key={m.id} className="border-b border-gray-800 pb-2 last:border-0">
                    {m.match_info && (
                      <div className="flex justify-center mb-1">
                        <span className="bg-gray-800 text-gray-300 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {m.match_info}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex-1">
                        <Link to={`/team/${m.team_a.id}`} className="text-white hover:text-indigo-300 font-medium">
                          {m.team_a.name}
                        </Link>
                        <div className="text-[9px] text-gray-500">
                          {ratingA}<span className={`ml-0.5 ${deltaA >= 0 ? 'text-green-400' : 'text-red-400'}`}>{deltaA >= 0 ? `+${deltaA}` : deltaA}</span>
                        </div>
                      </div>
                      <div className="text-center mx-1">
                        <div className="text-gray-400 font-mono font-bold text-sm">
                          {m.score_team_a}–{m.score_team_b}
                        </div>
                        <div className="text-[8px] text-gray-500 whitespace-nowrap">
                          {winProbPercentA}–{winProbPercentB}%
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <Link to={`/team/${m.team_b.id}`} className="text-white hover:text-indigo-300 font-medium">
                          {m.team_b.name}
                        </Link>
                        <div className="text-[9px] text-gray-500">
                          {ratingB}<span className={`ml-0.5 ${deltaB >= 0 ? 'text-green-400' : 'text-red-400'}`}>{deltaB >= 0 ? `+${deltaB}` : deltaB}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1 text-center">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component: AddStaff
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
    <div className="mt-3 border-t border-gray-800 pt-2">
      <h4 className="text-xs font-semibold text-white mb-2">Add staff</h4>
      <div className="flex flex-wrap gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
        >
          {STAFF_ROLE_OPTIONS.map((r) => (<option key={r} value={r}>{T.STAFF_ROLES[r]}</option>))}
        </select>
        <input
          className="flex-grow bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="mt-2 space-y-1">
        {results.length === 0 && search.trim() !== '' && (
          <p className="text-[10px] text-gray-500">No users found</p>
        )}
        {results.map((p) => (
          <div key={p.id} className="flex justify-between items-center border-b border-gray-800 pb-1">
            <Link to={`/profile/${p.id}`} className="text-white text-xs hover:underline">
              {personName(p)}
            </Link>
            <button
              onClick={() => onAdd(p.id, role)}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded"
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