import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase';
import { useMyTeams, useMyMemberships } from '../hooks/useTeams.js';

export default function TournamentsPage() {
  const { user } = useAuth();
  const { data: myManagedTeams = [] } = useMyTeams(user?.id);
  const { data: myMemberships = [] } = useMyMemberships(user?.id);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingInvites, setPendingInvites] = useState({}); // tournamentId -> invite object

  const userTeams = [
    ...myManagedTeams.map(t => ({ id: t.id, name: t.name })),
    ...myMemberships.filter(m => m.isCaptain).map(m => ({ id: m.teamId, name: m.name }))
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  // Fetch pending invites for user's teams
  const fetchPendingInvites = async () => {
    if (!userTeams.length) return;
    const teamIds = userTeams.map(t => t.id);
    const { data, error } = await supabase
      .from('tournament_invitations')
      .select('*, tournament:tournaments(id, title)')
      .in('team_id', teamIds)
      .eq('status', 'pending');
    if (!error) {
      const inviteMap = {};
      data.forEach(inv => { inviteMap[inv.tournament_id] = inv; });
      setPendingInvites(inviteMap);
    }
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

      const tournamentsWithTeams = await Promise.all(
        tournamentsData.map(async (tournament) => {
          const { data: teamsData, error: teamsError } = await supabase
            .from('tournament_teams')
            .select(`team_id, placement, teams (id, name, tag)`)
            .eq('tournament_id', tournament.id);
          if (teamsError) {
            console.error(`Error fetching teams for tournament ${tournament.id}:`, teamsError);
            return { ...tournament, tournament_teams: [] };
          }
          return { ...tournament, tournament_teams: teamsData || [] };
        })
      );
      setTournaments(tournamentsWithTeams);
      await fetchPendingInvites();
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [userTeams.length]);

  const handleRegister = async (tournamentId, teamId) => {
    const { error } = await supabase
      .from('tournament_teams')
      .insert({ tournament_id: tournamentId, team_id: teamId });
    if (error) alert(error.message);
    else {
      await fetchTournaments();
      alert('Team registered successfully!');
    }
  };

  const acceptInvite = async (tournamentId, teamId, inviteId) => {
    // First mark invite as accepted
    const { error: updateError } = await supabase
      .from('tournament_invitations')
      .update({ status: 'accepted' })
      .eq('id', inviteId);
    if (updateError) return alert(updateError.message);
    // Then add team to tournament_teams
    const { error: insertError } = await supabase
      .from('tournament_teams')
      .insert({ tournament_id: tournamentId, team_id: teamId });
    if (insertError) alert(insertError.message);
    else {
      alert('Invitation accepted! You are now registered.');
      await fetchTournaments();
    }
  };

  const isTeamRegistered = (tournament, teamId) => {
    return tournament.tournament_teams?.some(tt => tt.team_id === teamId);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registration': return <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Registration Open</span>;
      case 'ongoing': return <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Ongoing</span>;
      case 'closed': return <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">Finished</span>;
      default: return <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">{status}</span>;
    }
  };

  const [expandedId, setExpandedId] = useState(null);
  const [matches, setMatches] = useState({});

  const fetchMatches = async (tournamentId) => {
    if (matches[tournamentId]) return;
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, round, match_order, team_a_id, team_b_id, score_team_a, score_team_b, status,
        team_a:teams!team_a_id(name, tag),
        team_b:teams!team_b_id(name, tag)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_order', { ascending: true });
    if (!error) setMatches(prev => ({ ...prev, [tournamentId]: data || [] }));
  };

  const handleExpand = async (tournamentId) => {
    if (expandedId === tournamentId) {
      setExpandedId(null);
    } else {
      setExpandedId(tournamentId);
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament?.status === 'ongoing') await fetchMatches(tournamentId);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading tournaments...</div>;
  if (error) return <div className="text-center py-10 text-red-400">Error: {error}</div>;
  if (tournaments.length === 0) {
    return (
      <div className="rtr-card text-center py-10">
        <p className="text-gray-400">No tournaments available yet.</p>
        <button onClick={fetchTournaments} className="mt-4 bg-blue-600 px-4 py-2 rounded text-white">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Tournaments</h2>
        <p className="text-gray-400 text-sm">Browse, register, or accept invitations</p>
      </div>
      <div className="space-y-4">
        {tournaments.map(tournament => {
          const invite = pendingInvites[tournament.id];
          const isInvited = !!invite;
          const canRegisterOpen = tournament.registration_type === 'open' && tournament.status === 'registration';
          return (
            <div key={tournament.id} className="rtr-card">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-white font-bold text-xl">{tournament.title}</h3>
                    {getStatusBadge(tournament.status)}
                    {tournament.registration_type === 'invitational' && (
                      <span className="bg-purple-800 text-white text-xs px-2 py-1 rounded">Invite Only</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{tournament.description || 'No description'}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-400">
                    <span>📅 {tournament.start_date} – {tournament.end_date}</span>
                    <span>🎮 {tournament.format?.replace('_', ' ')}</span>
                    <span>⚡ Elo {tournament.min_elo}–{tournament.max_elo}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {tournament.status === 'registration' && user && (
                    <>
                      {canRegisterOpen && (
                        <select
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white"
                          onChange={(e) => { if (e.target.value) handleRegister(tournament.id, e.target.value); }}
                          value=""
                        >
                          <option value="" disabled>Register your team</option>
                          {userTeams.map(team => (
                            <option key={team.id} value={team.id} disabled={isTeamRegistered(tournament, team.id)}>
                              {team.name} {isTeamRegistered(tournament, team.id) ? '(registered)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {tournament.registration_type === 'invitational' && isInvited && (
                        <button
                          onClick={() => acceptInvite(tournament.id, invite.team_id, invite.id)}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded"
                        >
                          Accept Invitation
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => handleExpand(tournament.id)} className="text-blue-400 hover:text-blue-300 text-sm">
                    {expandedId === tournament.id ? '▲ Less' : '▼ Details'}
                  </button>
                </div>
              </div>

              {expandedId === tournament.id && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Registered Teams</h4>
                    <div className="flex flex-wrap gap-2">
                      {tournament.tournament_teams?.length > 0 ? (
                        tournament.tournament_teams.map(tt => (
                          <span key={tt.team_id} className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300">
                            {tt.teams?.name} {tt.teams?.tag ? `[${tt.teams.tag}]` : ''}
                            {tt.placement && ` (${tt.placement})`}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No teams registered yet</span>
                      )}
                    </div>
                  </div>

                  {tournament.status === 'ongoing' && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Matches</h4>
                      {!matches[tournament.id] ? (
                        <p className="text-gray-500 text-sm">Loading matches...</p>
                      ) : matches[tournament.id].length === 0 ? (
                        <p className="text-gray-500 text-sm">No matches reported yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {matches[tournament.id].map(match => (
                            <div key={match.id} className="bg-gray-800/50 rounded p-2 text-sm flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="text-white font-medium">{match.team_a?.name || '?'}</span>
                                <span className="text-gray-400">vs</span>
                                <span className="text-white font-medium">{match.team_b?.name || '?'}</span>
                              </div>
                              <div className="text-gray-300">{match.score_team_a ?? '-'} : {match.score_team_b ?? '-'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}