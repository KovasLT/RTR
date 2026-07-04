import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase';
import { useMyTeams, useMyMemberships } from '../hooks/useTeams.js';
import { getParticipantName } from '../components/tournament-manager/utils';
import StandingsTable from '../components/tournament-manager/StandingsTable';

export default function TournamentsPanel() {
  const { user } = useAuth();
  const { data: myManagedTeams = [] } = useMyTeams(user?.id);
  const { data: myMemberships = [] } = useMyMemberships(user?.id);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeringFor, setRegisteringFor] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [scheduledMatchesMap, setScheduledMatchesMap] = useState({});
  const [reportedMatchesMap, setReportedMatchesMap] = useState({});
  const [bracketAssignmentsMap, setBracketAssignmentsMap] = useState({});

  const userTeams = [
    ...myManagedTeams.map(t => ({ id: t.id, name: t.name })),
    ...myMemberships.filter(m => m.isCaptain).map(m => ({ id: m.teamId, name: m.name }))
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  const fetchParticipantsForTournament = async (tournamentId, type) => {
    try {
      if (type === 'team') {
        const { data: teamEntries, error: teamEntriesError } = await supabase
          .from('tournament_teams')
          .select('team_id, placement')
          .eq('tournament_id', tournamentId);
        if (teamEntriesError) throw teamEntriesError;
        if (!teamEntries || teamEntries.length === 0) return [];
        const teamIds = teamEntries.map(e => e.team_id);
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, tag')
          .in('id', teamIds);
        if (teamsError) throw teamsError;
        const merged = teamEntries.map(entry => ({
          team_id: entry.team_id,
          placement: entry.placement,
          teams: teamsData.find(t => t.id === entry.team_id) || { id: entry.team_id, name: 'Unknown', tag: '' }
        }));
        return merged;
      } else {
        const { data: playerEntries, error: playerEntriesError } = await supabase
          .from('tournament_players')
          .select('player_id, placement')
          .eq('tournament_id', tournamentId);
        if (playerEntriesError) throw playerEntriesError;
        if (!playerEntries || playerEntries.length === 0) return [];
        const playerIds = playerEntries.map(e => e.player_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, handle, avatar_url')
          .in('id', playerIds);
        if (profilesError) throw profilesError;
        const merged = playerEntries.map(entry => ({
          player_id: entry.player_id,
          placement: entry.placement,
          profiles: profilesData.find(p => p.id === entry.player_id) || { id: entry.player_id, display_name: 'Unknown', handle: '' }
        }));
        return merged;
      }
    } catch (err) {
      console.error('Error fetching participants for public view:', err);
      return [];
    }
  };

  const fetchBracketAssignments = async (tournamentId) => {
    const { data, error } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId);
    if (error) {
      console.error('Error fetching bracket assignments:', error);
      return {};
    }
    const assignments = {};
    data.forEach(assign => {
      const key = `${assign.bracket_type}-${assign.round_index}-${assign.slot_index}`;
      assignments[key] = assign.match_id;
    });
    return assignments;
  };

  const buildBracketState = (assignments, reportedMatches) => {
    const bracketState = {
      single: [
        { roundName: "Quarterfinals", slots: [{ matchId: '' }, { matchId: '' }, { matchId: '' }, { matchId: '' }] },
        { roundName: "Semifinals", slots: [{ matchId: '' }, { matchId: '' }] },
        { roundName: "Finals", slots: [{ matchId: '' }] }
      ],
      upper: [
        { roundName: "UB Semifinals", slots: [{ matchId: '' }, { matchId: '' }] },
        { roundName: "UB Finals", slots: [{ matchId: '' }] }
      ],
      lower: [
        { roundName: "LB Round 1", slots: [{ matchId: '' }, { matchId: '' }] },
        { roundName: "LB Finals", slots: [{ matchId: '' }] }
      ],
      grand: [
        { roundName: "Grand Finals", slots: [{ matchId: '' }] }
      ]
    };

    for (const [key, matchId] of Object.entries(assignments)) {
      const [bracketType, roundIdx, slotIdx] = key.split('-');
      if (bracketState[bracketType] && bracketState[bracketType][parseInt(roundIdx)]) {
        bracketState[bracketType][parseInt(roundIdx)].slots[parseInt(slotIdx)].matchId = matchId;
      }
    }
    return bracketState;
  };

  const renderBracketSection = (bracketArray, reportedMatches, participants, tournamentType, title) => {
    return (
      <div className="mb-10">
        {title && <h5 className="text-xs font-bold text-indigo-400 mb-6 uppercase border-b border-gray-800 pb-2 inline-block">{title}</h5>}
        <div className="flex flex-row justify-between gap-8 py-4 relative">
          {bracketArray.map((round, rIdx) => (
            <div key={round.roundName} className="flex flex-col justify-around flex-1 relative">
              <h6 className="text-center text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-6 absolute -top-8 w-full">{round.roundName}</h6>
              {round.slots.map((slot, sIdx) => {
                const assignedMatch = reportedMatches.find(m => m.id === slot.matchId);
                return (
                  <div key={`${rIdx}-${sIdx}`} className="my-2 flex flex-col relative z-10 bg-[#1a1c23] border border-gray-700 rounded-lg shadow-md">
                    {rIdx < bracketArray.length - 1 && <div className="absolute w-4 h-[2px] bg-gray-700 -right-4 top-1/2"></div>}
                    <div className="bg-[#0f1219] border-b border-gray-800 p-1.5 rounded-t-lg">
                      <div className="text-[10px] text-indigo-300 font-bold text-center">Match</div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_a > assignedMatch.score_team_b ? 'text-white font-bold' : 'text-gray-400'}`}>
                          {assignedMatch ? getParticipantName(assignedMatch.team_a_id, participants, tournamentType) : '---'}
                        </span>
                        <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                          {assignedMatch ? assignedMatch.score_team_a : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_b > assignedMatch.score_team_a ? 'text-white font-bold' : 'text-gray-400'}`}>
                          {assignedMatch ? getParticipantName(assignedMatch.team_b_id, participants, tournamentType) : '---'}
                        </span>
                        <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                          {assignedMatch ? assignedMatch.score_team_b : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const fetchAverageRating = async (ids, type) => {
    if (!ids.length) return null;
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('subject_type', type)
      .in('subject_id', ids);
    if (!data || data.length === 0) return null;
    const sum = data.reduce((acc, cur) => acc + cur.rating, 0);
    return Math.round(sum / data.length);
  };

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      if (tournamentsError) throw tournamentsError;
      if (!tournamentsData || tournamentsData.length === 0) {
        setTournaments([]);
        setLoading(false);
        return;
      }

      const tournamentsWithDetails = await Promise.all(
        tournamentsData.map(async (tournament) => {
          const participants = await fetchParticipantsForTournament(tournament.id, tournament.tournament_type);
          let avgRating = null;
          if (participants.length) {
            const ids = participants.map(p => p.team_id || p.player_id);
            avgRating = await fetchAverageRating(ids, tournament.tournament_type === 'team' ? 'team' : 'player');
          }

          const { data: scheduledData } = await supabase
            .from('scheduled_matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('scheduled_time', { ascending: true });
          setScheduledMatchesMap(prev => ({ ...prev, [tournament.id]: scheduledData || [] }));

          const { data: reportedData } = await supabase
            .from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .not('score_team_a', 'is', null)
            .not('score_team_b', 'is', null)
            .order('created_at', { ascending: true });
          setReportedMatchesMap(prev => ({ ...prev, [tournament.id]: reportedData || [] }));

          const assignments = await fetchBracketAssignments(tournament.id);
          setBracketAssignmentsMap(prev => ({ ...prev, [tournament.id]: assignments }));

          return { ...tournament, participants, avgParticipantRating: avgRating };
        })
      );
      setTournaments(tournamentsWithDetails);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const isUserRegistered = (tournament) => {
    if (!user) return false;
    const isPlayerTournament = tournament.tournament_type === 'player' || tournament.tournament_type === '1v1';
    if (isPlayerTournament) {
      return tournament.participants?.some(p => p.player_id === user.id);
    } else {
      return tournament.participants?.some(p => userTeams.some(t => t.id === p.team_id));
    }
  };

  const handleRegister = async (tournamentId, participantId, participantType) => {
    setRegisterLoading(true);
    const table = participantType === 'team' ? 'tournament_teams' : 'tournament_players';
    const column = participantType === 'team' ? 'team_id' : 'player_id';
    const { error } = await supabase
      .from(table)
      .insert({ tournament_id: tournamentId, [column]: participantId });
    if (error) {
      alert(error.message);
    } else {
      await fetchTournaments();
      alert(`Successfully registered ${participantType === 'team' ? 'team' : 'you'}!`);
      setShowRegisterModal(false);
    }
    setRegisterLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registration': return <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Registration Open</span>;
      case 'ongoing': return <span className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Ongoing</span>;
      case 'closed': return <span className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Finished</span>;
      default: return <span className="bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">{status}</span>;
    }
  };

  if (loading) return <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div></div>;
  if (error) return <div className="text-center py-10 text-red-400 bg-red-950/20 border border-red-500/50 rounded-xl p-4">{error}</div>;
  if (tournaments.length === 0) {
    return (
      <div className="rtr-card text-center py-16 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="text-gray-400 text-lg mb-4">No tournaments available yet.</div>
        <button onClick={fetchTournaments} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg transition shadow-lg">Refresh</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tournaments.map(tournament => {
        const isPlayerTournament = tournament.tournament_type === 'player' || tournament.tournament_type === '1v1';
        return (
          <div key={tournament.id} className="group relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-indigo-500/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="p-5 md:p-6">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="text-white font-bold text-2xl tracking-tight">{tournament.title}</h3>
                    {isPlayerTournament ? (
                      <span className="bg-purple-600/80 text-white text-xs font-semibold px-2 py-0.5 rounded-full">1v1</span>
                    ) : (
                      <span className="bg-amber-600/80 text-white text-xs font-semibold px-2 py-0.5 rounded-full">5v5</span>
                    )}
                    {getStatusBadge(tournament.status)}
                  </div>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">{tournament.description || 'No description provided.'}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="text-base">📅</span> {tournament.start_date} – {tournament.end_date}</span>
                    <span className="flex items-center gap-1.5"><span className="text-base">🎮</span> {tournament.format?.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1.5"><span className="text-base">⚡</span> Elo {tournament.min_elo} – {tournament.max_elo}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {tournament.avgParticipantRating && (
                    <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-full px-3 py-1 text-xs font-mono text-indigo-300 shadow-sm">
                      ⭐ Avg. Rating: {tournament.avgParticipantRating}
                    </div>
                  )}
                  <div className="flex gap-3 items-center">
                    {tournament.status === 'registration' && user && !isUserRegistered(tournament) && (
                      <button
                        onClick={() => {
                          setRegisteringFor(tournament);
                          setShowRegisterModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
                      >
                        Register
                      </button>
                    )}
                    {isUserRegistered(tournament) && (
                      <span className="text-green-400 text-xs bg-green-950/30 px-3 py-1 rounded-full">Registered</span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setShowDetailsModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Details Modal */}
      {showDetailsModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{selectedTournament.title}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2 items-center">
                {(selectedTournament.tournament_type === 'player' || selectedTournament.tournament_type === '1v1') ? (
                  <span className="bg-purple-600/80 text-white text-xs font-semibold px-2 py-0.5 rounded-full">1v1</span>
                ) : (
                  <span className="bg-amber-600/80 text-white text-xs font-semibold px-2 py-0.5 rounded-full">5v5</span>
                )}
                {getStatusBadge(selectedTournament.status)}
                {selectedTournament.avgParticipantRating && (
                  <span className="bg-indigo-950/40 border border-indigo-500/30 rounded-full px-3 py-1 text-xs font-mono text-indigo-300">
                    ⌀ Rating: {selectedTournament.avgParticipantRating}
                  </span>
                )}
              </div>
              <p className="text-gray-300">{selectedTournament.description || 'No description'}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Dates:</span> {selectedTournament.start_date} – {selectedTournament.end_date}</div>
                <div><span className="text-gray-500">Format:</span> {selectedTournament.format?.replace('_', ' ')}</div>
                <div><span className="text-gray-500">Elo Range:</span> {selectedTournament.min_elo} – {selectedTournament.max_elo}</div>
                <div><span className="text-gray-500">Created by:</span> {selectedTournament.created_by?.slice(0,8)}…</div>
              </div>

              {/* Participants */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-3">
                  {(selectedTournament.tournament_type === 'player' || selectedTournament.tournament_type === '1v1') ? 'Registered Players' : 'Registered Teams'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTournament.participants?.length > 0 ? (
                    selectedTournament.participants.map(p => {
                      const id = p.team_id || p.player_id;
                      const name = getParticipantName(id, selectedTournament.participants, selectedTournament.tournament_type);
                      return (
                        <span key={p.team_id || p.player_id} className="bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-full text-sm text-gray-300">
                          {name}
                          {p.placement && <span className="text-amber-400 ml-1">(#{p.placement})</span>}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">No participants yet.</span>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-3">Schedule</h3>
                {scheduledMatchesMap[selectedTournament.id]?.length === 0 ? (
                  <p className="text-gray-500">No scheduled matches.</p>
                ) : (
                  <div className="space-y-2">
                    {scheduledMatchesMap[selectedTournament.id]?.map(m => {
                      const p1Name = getParticipantName(m.participant_a_id, selectedTournament.participants, selectedTournament.tournament_type);
                      const p2Name = getParticipantName(m.participant_b_id, selectedTournament.participants, selectedTournament.tournament_type);
                      return (
                        <div key={m.id} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">{p1Name}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="text-white font-medium">{p2Name}</span>
                          </div>
                          <div className="text-gray-300">{new Date(m.scheduled_time).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bracket */}
              {selectedTournament.format !== 'round_robin' && (
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Bracket</h3>
                  {(() => {
                    const assignments = bracketAssignmentsMap[selectedTournament.id] || {};
                    const bracketState = buildBracketState(assignments, reportedMatchesMap[selectedTournament.id] || []);
                    const reportedMatches = reportedMatchesMap[selectedTournament.id] || [];
                    const participants = selectedTournament.participants;
                    const tournamentType = selectedTournament.tournament_type;
                    return (
                      <div className="overflow-x-auto">
                        {selectedTournament.format === 'playoffs' && renderBracketSection(bracketState.single, reportedMatches, participants, tournamentType, null)}
                        {selectedTournament.format === 'double_elimination' && (
                          <div className="space-y-8">
                            {renderBracketSection(bracketState.upper, reportedMatches, participants, tournamentType, 'Upper Bracket')}
                            {renderBracketSection(bracketState.lower, reportedMatches, participants, tournamentType, 'Lower Bracket')}
                            {renderBracketSection(bracketState.grand, reportedMatches, participants, tournamentType, 'Grand Finals')}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Standings (round robin) – using StandingsTable */}
              {selectedTournament.format === 'round_robin' && (
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Standings</h3>
                  {(() => {
                    const stats = {};
                    // Include registered participants
                    selectedTournament.participants.forEach(p => {
                      const id = p.team_id || p.player_id;
                      stats[id] = {
                        id,
                        name: getParticipantName(id, selectedTournament.participants, selectedTournament.tournament_type),
                        played: 0, w: 0, l: 0, pts: 0
                      };
                    });
                    // Process reported matches, adding missing participants on the fly
                    (reportedMatchesMap[selectedTournament.id] || []).forEach(m => {
                      const p1 = m.team_a_id;
                      const p2 = m.team_b_id;
                      const s1 = m.score_team_a;
                      const s2 = m.score_team_b;
                      if (!stats[p1]) {
                        stats[p1] = {
                          id: p1,
                          name: getParticipantName(p1, [], selectedTournament.tournament_type),
                          played: 0, w: 0, l: 0, pts: 0
                        };
                      }
                      if (!stats[p2]) {
                        stats[p2] = {
                          id: p2,
                          name: getParticipantName(p2, [], selectedTournament.tournament_type),
                          played: 0, w: 0, l: 0, pts: 0
                        };
                      }
                      stats[p1].played++;
                      stats[p2].played++;
                      if (s1 > s2) {
                        stats[p1].w++;
                        stats[p1].pts += 3;
                        stats[p2].l++;
                      } else if (s2 > s1) {
                        stats[p2].w++;
                        stats[p2].pts += 3;
                        stats[p1].l++;
                      }
                    });
                    const standingsArray = Object.values(stats).sort((a,b) => b.pts - a.pts || b.w - a.w);
                    return <StandingsTable standings={standingsArray} />;
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && registeringFor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowRegisterModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Register for {registeringFor.title}</h3>
            {(registeringFor.tournament_type === 'player' || registeringFor.tournament_type === '1v1') ? (
              <button onClick={() => handleRegister(registeringFor.id, user.id, 'player')} disabled={registerLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">
                {registerLoading ? 'Registering...' : 'Register as a player'}
              </button>
            ) : (
              <div className="space-y-2">
                {userTeams.length === 0 ? (
                  <p className="text-gray-400 text-sm">You are not a manager or captain of any team.</p>
                ) : (
                  userTeams.map(team => (
                    <button key={team.id} onClick={() => handleRegister(registeringFor.id, team.id, 'team')} disabled={registerLoading} className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition disabled:opacity-50">
                      {team.name}
                    </button>
                  ))
                )}
              </div>
            )}
            <button onClick={() => setShowRegisterModal(false)} className="w-full mt-3 text-gray-400 hover:text-white py-2 rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}