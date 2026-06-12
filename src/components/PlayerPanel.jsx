import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMyMemberships } from '../hooks/useTeams.js';
import { useRatingHistory, usePlayerMutations } from '../hooks/useProfiles.js';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../app-constants';
import Sparkline from './Sparkline';
import RatingBadge from './RatingBadge';
import ActivityCard from './ActivityCard';

const winProbability = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

const PlayerPanel = ({ profile, rating, userId }) => {
  const p = profile?.player;
  const { data: teams = [] } = useMyMemberships(userId);
  const { data: history = [] } = useRatingHistory('player', userId);
  const { setLookingForTeam } = usePlayerMutations();
  const heroPool = Array.isArray(p?.hero_pool) ? p.hero_pool : [];

  const userTeam = teams[0]; // player can only have one team

  const [recentMatches, setRecentMatches] = useState([]);
  const [tournamentPlacements, setTournamentPlacements] = useState([]);
  const [winRate, setWinRate] = useState(null);
  const [matchesPlayed, setMatchesPlayed] = useState(null);
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    if (!userTeam) {
      setLoadingExtra(false);
      return;
    }
    const fetchExtra = async () => {
      setLoadingExtra(true);
      try {
        const { data: matches } = await supabase
          .from('matches')
          .select(`
            id, created_at, match_info, score_team_a, score_team_b,
            team_a_rating_before, team_a_rating_after,
            team_b_rating_before, team_b_rating_after,
            team_a:teams!team_a_id(id, name, tag),
            team_b:teams!team_b_id(id, name, tag)
          `)
          .or(`team_a_id.eq.${userTeam.teamId},team_b_id.eq.${userTeam.teamId}`)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(3);
        setRecentMatches(matches || []);

        const { data: placements } = await supabase
          .from('tournament_teams')
          .select(`
            placement,
            tournament:tournaments(title, start_date, end_date)
          `)
          .eq('team_id', userTeam.teamId)
          .not('placement', 'is', null)
          .order('placement', { ascending: true });
        setTournamentPlacements(placements || []);

        const { data: allMatches } = await supabase
          .from('matches')
          .select('score_team_a, score_team_b, team_a_id, team_b_id')
          .or(`team_a_id.eq.${userTeam.teamId},team_b_id.eq.${userTeam.teamId}`)
          .eq('status', 'confirmed');
        if (allMatches && allMatches.length) {
          let wins = 0;
          allMatches.forEach(m => {
            const isTeamA = m.team_a_id === userTeam.teamId;
            const teamScore = isTeamA ? m.score_team_a : m.score_team_b;
            const oppScore = isTeamA ? m.score_team_b : m.score_team_a;
            if (teamScore > oppScore) wins++;
          });
          setWinRate(Math.round((wins / allMatches.length) * 100));
          setMatchesPlayed(allMatches.length);
        } else {
          setWinRate(null);
          setMatchesPlayed(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExtra(false);
      }
    };
    fetchExtra();
  }, [userTeam]);

  return (
    <div className="space-y-4">
      {/* Basic info card */}
      <div className="rtr-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            <i className={`fas ${APP_CONSTANTS.ROLE_ICONS.player} mr-2 text-indigo-300`}></i>
            Player
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
            <div className="text-gray-500 text-sm mb-1">Hero pool</div>
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
            {p?.looking_for_team ? 'Looking for team' : 'Not looking'}
          </span>
          <button
            onClick={() => setLookingForTeam.mutate({ userId, value: !p?.looking_for_team })}
            disabled={setLookingForTeam.isPending}
            className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500 disabled:opacity-50"
          >
            {p?.looking_for_team ? 'Stop looking' : 'Start looking'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!loadingExtra && userTeam && (
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
            <div className="text-xl font-bold text-white">{matchesPlayed !== null ? matchesPlayed : '—'}</div>
            <div className="text-[10px] text-gray-400">Matches</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-white">{Math.max(...history.map(h => h.new_rating), 0) || '—'}</div>
            <div className="text-[10px] text-gray-400">Peak rating</div>
          </div>
        </div>
      )}

      {/* Rating history sparkline */}
      <div className="rtr-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Rating History</h3>
          {history.length > 0 && (
            <div className="text-xs text-gray-400 flex gap-4">
              <span>Current: <span className="text-indigo-300 font-mono font-bold">{history[history.length - 1].new_rating}</span></span>
              <span>Peak: <span className="text-indigo-300 font-mono font-bold">{Math.max(...history.map((h) => h.new_rating))}</span></span>
            </div>
          )}
        </div>
        {history.length < 2 ? (
          <p className="text-sm text-gray-400">Not enough data yet – play more matches to see rating history.</p>
        ) : (
          <Sparkline values={history.map((h) => h.new_rating)} width={400} height={56} className="w-full h-14" />
        )}
      </div>

      {/* My teams */}
      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-3">My Teams</h3>
        {teams.length === 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-400">You are not on a team yet.</p>
            <Link to="/teams" className="text-sm text-indigo-300 hover:text-indigo-200 font-medium">
              <i className="fas fa-magnifying-glass mr-1.5"></i> Find a team
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
                      <span className="ml-2 text-[10px] uppercase tracking-wide font-semibold bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 rounded px-1.5 py-0.5">Captain</span>
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
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent matches */}
      {userTeam && !loadingExtra && recentMatches.length > 0 && (
        <div className="rtr-card">
          <h3 className="text-sm font-semibold text-white mb-2">Recent matches</h3>
          <div className="space-y-2">
            {recentMatches.map(m => {
              const isTeamA = m.team_a_id === userTeam.teamId;
              const ratingTeam = isTeamA ? (m.team_a_rating_before || 1200) : (m.team_b_rating_before || 1200);
              const ratingOpp = isTeamA ? (m.team_b_rating_before || 1200) : (m.team_a_rating_before || 1200);
              const deltaTeam = isTeamA ? (m.team_a_rating_after || 0) - ratingTeam : (m.team_b_rating_after || 0) - ratingTeam;
              const teamScore = isTeamA ? m.score_team_a : m.score_team_b;
              const oppScore = isTeamA ? m.score_team_b : m.score_team_a;
              const opponentName = isTeamA ? m.team_b?.name : m.team_a?.name;
              const winProb = winProbability(ratingTeam, ratingOpp);
              const winProbPercent = Math.round(winProb * 100);
              const oppProbPercent = 100 - winProbPercent;
              const result = teamScore > oppScore ? 'Win' : teamScore === oppScore ? 'Draw' : 'Loss';
              const resultColor = result === 'Win' ? 'text-green-400' : result === 'Loss' ? 'text-red-400' : 'text-yellow-400';
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
                      <span className="text-white font-medium">vs {opponentName}</span>
                      <div className="text-[9px] text-gray-500">
                        {ratingTeam}<span className={`ml-0.5 ${deltaTeam >= 0 ? 'text-green-400' : 'text-red-400'}`}>{deltaTeam >= 0 ? `+${deltaTeam}` : deltaTeam}</span>
                      </div>
                    </div>
                    <div className="text-center mx-1">
                      <div className="text-gray-400 font-mono font-bold text-sm">
                        {teamScore}–{oppScore}
                      </div>
                      <div className="text-[8px] text-gray-500 whitespace-nowrap">
                        {winProbPercent}–{oppProbPercent}%
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <span className={`font-mono font-bold ${resultColor}`}>{result}</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1 text-center">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      {!loadingExtra && tournamentPlacements.length > 0 && (
        <div className="rtr-card">
          <h3 className="text-sm font-semibold text-white mb-2">Achievements</h3>
          <div className="space-y-1">
            {tournamentPlacements.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="text-lg">{p.placement === 1 ? '🥇' : p.placement === 2 ? '🥈' : p.placement === 3 ? '🥉' : '🏅'}</span>
                <span className="text-gray-300">{p.tournament?.title || 'Unknown tournament'}</span>
                <span className="text-gray-500">(#{p.placement})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ActivityCard events={history} />
    </div>
  );
};

export default PlayerPanel;