import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMyStaffTeams } from '../hooks/useTeams.js';
import { useRatingHistory } from '../hooks/useProfiles.js';
import { useEndorsements } from '../hooks/useEndorsements.js';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../app-constants';
import Sparkline from './Sparkline';

const D = APP_CONSTANTS.DASHBOARD;

const CoachPanel = ({ profile, rating, userId }) => {
  const c = profile?.coach;
  const { data: teams = [] } = useMyStaffTeams(userId, 'coach');
  const { data: history = [] } = useRatingHistory('coach', userId);
  const { data: endorsements = [] } = useEndorsements(userId);
  const endorseCount = endorsements.filter((e) => e.subject_type === 'coach').length;

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamStats, setTeamStats] = useState({});
  const [teamLineups, setTeamLineups] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingLineups, setLoadingLineups] = useState(false);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].teamId);
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (!teams.length) return;
    const fetchData = async () => {
      setLoadingStats(true);
      setLoadingLineups(true);
      const statsMap = {};
      const lineupMap = {};

      for (const team of teams) {
        const teamId = team.teamId;

        // Win rate
        const { data: allMatches } = await supabase
          .from('matches')
          .select('score_team_a, score_team_b, team_a_id, team_b_id')
          .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
          .eq('status', 'confirmed');
        let winRate = null;
        let wins = 0, total = 0;
        if (allMatches && allMatches.length) {
          total = allMatches.length;
          allMatches.forEach(m => {
            const isTeamA = m.team_a_id === teamId;
            const teamScore = isTeamA ? m.score_team_a : m.score_team_b;
            const oppScore = isTeamA ? m.score_team_b : m.score_team_a;
            if (teamScore > oppScore) wins++;
          });
          winRate = Math.round((wins / total) * 100);
        }

        // Recent matches (last 3) – with proper team name extraction
        const { data: recentMatchesRaw } = await supabase
          .from('matches')
          .select(`
            id, created_at, match_info, score_team_a, score_team_b, team_a_id, team_b_id,
            team_a:teams!team_a_id(name, tag),
            team_b:teams!team_b_id(name, tag)
          `)
          .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(3);

        const processedMatches = (recentMatchesRaw || []).map(m => {
          // Safely extract team objects (handle possible array)
          const teamA = Array.isArray(m.team_a) ? m.team_a[0] : m.team_a;
          const teamB = Array.isArray(m.team_b) ? m.team_b[0] : m.team_b;

          if (m.team_a_id === teamId) {
            return {
              id: m.id,
              created_at: m.created_at,
              opponentName: teamB?.name || 'Unknown',
              teamScore: m.score_team_a,
              oppScore: m.score_team_b,
            };
          } else if (m.team_b_id === teamId) {
            return {
              id: m.id,
              created_at: m.created_at,
              opponentName: teamA?.name || 'Unknown',
              teamScore: m.score_team_b,
              oppScore: m.score_team_a,
            };
          } else {
            return {
              id: m.id,
              created_at: m.created_at,
              opponentName: 'Unknown',
              teamScore: 0,
              oppScore: 0,
            };
          }
        });

        // Team rating
        const { data: teamRating } = await supabase
          .from('ratings')
          .select('rating')
          .eq('subject_id', teamId)
          .eq('subject_type', 'team')
          .single();

        statsMap[teamId] = {
          winRate,
          recentMatches: processedMatches,
          rating: teamRating?.rating || 1200,
        };

        // Team lineup (top 5 players by rating)
        const { data: members } = await supabase
          .from('team_members')
          .select(`
            user_id,
            profile:profiles(display_name, handle, avatar_url)
          `)
          .eq('team_id', teamId);

        if (members && members.length) {
          const userIds = members.map(m => m.user_id);
          const { data: playerProfiles } = await supabase
            .from('player_profiles')
            .select(`user_id, lane:lanes(name)`)
            .in('user_id', userIds);
          const playerMap = new Map(playerProfiles?.map(p => [p.user_id, p]) || []);

          const { data: ratings } = await supabase
            .from('ratings')
            .select('subject_id, rating')
            .eq('subject_type', 'player')
            .in('subject_id', userIds);
          const ratingMap = new Map(ratings?.map(r => [r.subject_id, r.rating]) || []);

          const playersWithRating = members.map(m => {
            const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
            const playerProfile = playerMap.get(m.user_id);
            return {
              id: m.user_id,
              name: prof?.display_name || prof?.handle || 'Unknown',
              avatar: prof?.avatar_url,
              lane: playerProfile?.lane?.name || '—',
              rating: ratingMap.get(m.user_id) || 1200,
            };
          });
          playersWithRating.sort((a, b) => b.rating - a.rating);
          lineupMap[teamId] = playersWithRating.slice(0, 5);
        } else {
          lineupMap[teamId] = [];
        }
      }
      setTeamStats(statsMap);
      setTeamLineups(lineupMap);
      setLoadingStats(false);
      setLoadingLineups(false);
    };
    fetchData();
  }, [teams]);

  const selectedTeam = teams.find(t => t.teamId === selectedTeamId);
  const currentTeamStats = selectedTeamId ? teamStats[selectedTeamId] : null;
  const currentTeamLineup = selectedTeamId ? teamLineups[selectedTeamId] : [];

  const currentRating = history.length > 0 ? history[history.length - 1].new_rating : rating;
  const peakRating = history.length > 0 ? Math.max(...history.map((h) => h.new_rating)) : rating;

  return (
    <div className="space-y-6">
      {/* Coach Profile Card */}
      <div className="rtr-card bg-[#111111] border border-[#222]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <i className={`fas ${APP_CONSTANTS.ROLE_ICONS.coach} mr-3 text-indigo-300`}></i>
            {D.COACH_TITLE}
          </h3>
          <div className="text-sm font-semibold text-gray-400 tracking-wide">
            Rating: <span className="text-indigo-300 font-mono ml-1">{rating || 1200}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="text-gray-500 text-xs mb-1">Specialties</div>
            <div className="text-gray-200">{c?.specialties || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Experience</div>
            <div className="text-gray-200">{c?.experience_years != null ? `${c.experience_years} ${D.COACH_YEARS}` : '—'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Availability</div>
            <div className="text-gray-200">{c?.availability || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Endorsements</div>
            <div className="text-gray-200 flex items-center">
              <i className="fas fa-thumbs-up text-indigo-400 mr-2"></i>
              {endorseCount}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Teams & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Selected Team Details */}
        <div className="flex flex-col gap-6">
          {teams.length === 0 ? (
            <div className="rtr-card bg-[#111111] border border-[#222] h-full flex items-center justify-center min-h-[220px]">
              <p className="text-sm text-gray-500">You are not coaching any team yet.</p>
            </div>
          ) : (
            <>
              {teams.length > 1 && (
                <div className="bg-gray-800/30 rounded-lg p-2 flex justify-center">
                  <select
                    value={selectedTeamId || ''}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {teams.map(team => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.name} {team.tag ? `[${team.tag}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTeam && currentTeamStats && (
                <div className="rtr-card bg-[#111111] border border-[#222] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/team/${selectedTeam.teamId}`} className="text-2xl font-bold text-white hover:text-indigo-300 transition-colors">
                          {selectedTeam.name} <span className="text-gray-500 text-lg font-normal ml-1">[{selectedTeam.tag || 'TBD'}]</span>
                        </Link>
                        <div className="flex gap-4 mt-2 text-[11px] text-gray-400 tracking-wide">
                          <span>Status: <span className="text-gray-300">{selectedTeam.status}</span></span>
                          <span>Region: <span className="text-gray-300">{selectedTeam.regionCode || '—'}</span></span>
                          <span>Rating: <span className="text-gray-300">{currentTeamStats.rating}</span></span>
                          {currentTeamStats.winRate !== null && <span>Win rate: <span className="text-gray-300">{currentTeamStats.winRate}%</span></span>}
                        </div>
                      </div>
                      <Link to={`/team/${selectedTeam.teamId}`} className="text-[10px] uppercase tracking-wider bg-[#1a1b1e] hover:bg-[#2c2d31] border border-[#333] px-3 py-1.5 rounded transition-colors text-gray-300">
                        Team page
                      </Link>
                    </div>

                    {/* Recent Matches List */}
                    <div className="mt-8">
                      <h4 className="text-[10px] font-semibold text-gray-500 mb-3 uppercase tracking-wider">Recent Matches</h4>
                      {currentTeamStats.recentMatches.length === 0 ? (
                        <p className="text-xs text-gray-600 italic">No recent matches played.</p>
                      ) : (
                        <div className="space-y-2">
                          {currentTeamStats.recentMatches.map(m => {
                            const result = m.teamScore > m.oppScore ? 'Win' : m.teamScore === m.oppScore ? 'Draw' : 'Loss';
                            const resultColor = result === 'Win' ? 'text-emerald-400' : result === 'Loss' ? 'text-rose-500' : 'text-amber-400';
                            return (
                              <div key={m.id} className="grid grid-cols-[1fr_auto_1fr] items-center text-xs">
                                <span className="text-gray-300 truncate pr-4">vs {m.opponentName || '?'}</span>
                                <span className={`font-mono font-medium ${resultColor} text-center w-12`}>{m.teamScore}-{m.oppScore}</span>
                                <span className="text-gray-600 text-right">{new Date(m.created_at).toISOString().split('T')[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Rating History */}
        <div className="rtr-card bg-[#111111] border border-[#222] relative min-h-[220px] flex flex-col justify-end p-0 overflow-hidden group">
          <div className="absolute top-4 right-5 flex gap-4 text-xs z-10">
            <span className="text-gray-400">Current: <span className="text-indigo-200 font-mono font-bold ml-1">{currentRating}</span></span>
            <span className="text-gray-400">Peak: <span className="text-indigo-200 font-mono font-bold ml-1">{peakRating}</span></span>
          </div>
          <div className="flex-1 w-full flex items-end pt-12">
            {history.length < 2 ? (
              <div className="w-full h-full flex items-center justify-center pb-8">
                <p className="text-sm text-gray-600">Not enough data to display history.</p>
              </div>
            ) : (
              <div className="w-full h-32 px-2 pb-2">
                <Sparkline values={history.map((h) => h.new_rating)} width={600} height={120} className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Team Lineup for Selected Team */}
      {selectedTeam && currentTeamLineup?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl text-white mb-6 font-medium">
            {teams.length > 1 ? `${selectedTeam.name}'s lineup` : "Team's lineup"}
          </h3>
          {loadingLineups ? (
            <p className="text-sm text-gray-500">Loading lineup...</p>
          ) : currentTeamLineup.length === 0 ? (
            <p className="text-sm text-gray-500">No players assigned to this team.</p>
          ) : (
            <div className="flex flex-wrap gap-6 sm:gap-8">
              {currentTeamLineup.map(player => (
                <div key={player.id} className="flex flex-col items-center group cursor-pointer w-20 sm:w-24">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.25rem] overflow-hidden border-2 border-transparent group-hover:border-indigo-500 group-hover:-translate-y-1 transition-all duration-300 bg-[#232428] flex items-center justify-center shadow-lg">
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <i className="fab fa-discord text-4xl text-indigo-400"></i>
                    )}
                  </div>
                  <div className="mt-3 text-center w-full">
                    <div className="text-sm text-gray-200 font-medium truncate w-full group-hover:text-white transition-colors" title={player.name}>
                      {player.name}
                    </div>
                    <div className="text-sm text-gray-400 font-mono mt-0.5">{player.rating}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoachPanel;