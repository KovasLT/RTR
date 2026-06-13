import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase';
import { useMyTeams, useMyMemberships } from '../hooks/useTeams.js';

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

  const userTeams = [
    ...myManagedTeams.map(t => ({ id: t.id, name: t.name })),
    ...myMemberships.filter(m => m.isCaptain).map(m => ({ id: m.teamId, name: m.name }))
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

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

      const enriched = await Promise.all(
        tournamentsData.map(async (tournament) => {
          let participants = [];
          let avgRating = null;

          // Determine if tournament is 1v1 (player) or 5v5 (team)
          const isPlayerTournament = tournament.tournament_type === 'player' || tournament.tournament_type === '1v1';

          if (isPlayerTournament) {
            const { data: players, error: pErr } = await supabase
              .from('tournament_players')
              .select(`
                player_id,
                placement,
                player:profiles!player_id(display_name, handle)
              `)
              .eq('tournament_id', tournament.id);
            if (!pErr && players) {
              participants = players;
              const playerIds = players.map(p => p.player_id);
              avgRating = await fetchAverageRating(playerIds, 'player');
            } else if (pErr) console.error(pErr);
          } else {
            const { data: teamLinks, error: tErr } = await supabase
              .from('tournament_teams')
              .select('team_id, placement')
              .eq('tournament_id', tournament.id);
            if (!tErr && teamLinks && teamLinks.length) {
              const teamIds = teamLinks.map(tl => tl.team_id);
              const { data: teamsData, error: teamsErr } = await supabase
                .from('teams')
                .select('id, name, tag')
                .in('id', teamIds);
              if (!teamsErr && teamsData) {
                participants = teamLinks.map(tl => ({
                  team_id: tl.team_id,
                  placement: tl.placement,
                  team: teamsData.find(t => t.id === tl.team_id)
                }));
                avgRating = await fetchAverageRating(teamIds, 'team');
              } else if (teamsErr) console.error(teamsErr);
            } else if (tErr) console.error(tErr);
          }
          return { ...tournament, participants, avgParticipantRating: avgRating };
        })
      );
      setTournaments(enriched);
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
                    selectedTournament.participants.map(p => (
                      <span key={p.team_id || p.player_id} className="bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-full text-sm text-gray-300">
                        {(selectedTournament.tournament_type === 'player' || selectedTournament.tournament_type === '1v1')
                          ? (p.player?.display_name || p.player?.handle || 'Unknown')
                          : `${p.team?.name} ${p.team?.tag ? `[${p.team.tag}]` : ''}`
                        }
                        {p.placement && <span className="text-amber-400 ml-1">(#{p.placement})</span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No participants yet.</span>
                  )}
                </div>
              </div>

              {/* Matches (if ongoing) */}
              {selectedTournament.status === 'ongoing' && (
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Matches</h3>
                  <div className="space-y-2">
                    <p className="text-gray-500 text-sm">Match data will appear once reported.</p>
                  </div>
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
            <h3 className="text-xl font-bold text-white mb-4">
              Register for {registeringFor.title}
            </h3>
            {(registeringFor.tournament_type === 'player' || registeringFor.tournament_type === '1v1') ? (
              <button
                onClick={() => handleRegister(registeringFor.id, user.id, 'player')}
                disabled={registerLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {registerLoading ? 'Registering...' : 'Register as a player'}
              </button>
            ) : (
              <div className="space-y-2">
                {userTeams.length === 0 ? (
                  <p className="text-gray-400 text-sm">You are not a manager or captain of any team.</p>
                ) : (
                  userTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleRegister(registeringFor.id, team.id, 'team')}
                      disabled={registerLoading}
                      className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition disabled:opacity-50"
                    >
                      {team.name}
                    </button>
                  ))
                )}
              </div>
            )}
            <button
              onClick={() => setShowRegisterModal(false)}
              className="w-full mt-3 text-gray-400 hover:text-white py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}