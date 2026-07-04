import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase';
import { useMyTeams, useMyMemberships } from '../hooks/useTeams.js';
import BracketRenderer from '../components/tournament-manager/BracketRenderer';

export default function TournamentsPage() {
  const { user } = useAuth();
  const { data: myManagedTeams = [] } = useMyTeams(user?.id);
  const { data: myMemberships = [] } = useMyMemberships(user?.id);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [participantsMap, setParticipantsMap] = useState({});
  const [scheduleMap, setScheduleMap] = useState({});
  const [reportedMatchesMap, setReportedMatchesMap] = useState({});

  const userTeams = [
    ...myManagedTeams.map(t => ({ id: t.id, name: t.name })),
    ...myMemberships.filter(m => m.isCaptain).map(m => ({ id: m.teamId, name: m.name }))
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  const fetchParticipantsForTournament = async (tournamentId, type) => {
    try {
      if (type === 'team') {
        const { data, error } = await supabase
          .from('tournament_teams')
          .select(`team_id, placement, teams (id, name, tag)`)
          .eq('tournament_id', tournamentId);
        if (!error) return data || [];
      } else {
        const { data, error } = await supabase
          .from('tournament_players')
          .select(`player_id, placement, profiles (id, display_name, handle)`)
          .eq('tournament_id', tournamentId);
        if (!error) return data || [];
      }
    } catch (err) { console.error(err); }
    return [];
  };

  const fetchSchedule = async (tournamentId) => {
    const { data, error } = await supabase
      .from('scheduled_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('scheduled_time', { ascending: true });
    if (!error) return data || [];
    return [];
  };

  const fetchReportedMatches = async (tournamentId) => {
    const { data, error } = await supabase
      .from('reported_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('flagged', false);
    if (!error) return data || [];
    return [];
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

      const participantsTemp = {};
      const scheduleTemp = {};
      const reportedTemp = {};

      for (const tournament of tournamentsData) {
        participantsTemp[tournament.id] = await fetchParticipantsForTournament(tournament.id, tournament.tournament_type);
        scheduleTemp[tournament.id] = await fetchSchedule(tournament.id);
        reportedTemp[tournament.id] = await fetchReportedMatches(tournament.id);
      }

      setParticipantsMap(participantsTemp);
      setScheduleMap(scheduleTemp);
      setReportedMatchesMap(reportedTemp);
      setTournaments(tournamentsData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const getParticipantName = (id, tournamentId) => {
    if (!id) return "TBD";
    const participants = participantsMap[tournamentId] || [];
    const p = participants.find(part => (part.team_id === id || part.player_id === id));
    if (!p) return "Unknown";
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament?.tournament_type === 'team') {
      return `${p.teams?.name || '?'} ${p.teams?.tag ? `[${p.teams.tag}]` : ''}`;
    } else {
      return p.profiles?.display_name || p.profiles?.handle || 'Unknown Player';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registration': return <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Registration Open</span>;
      case 'ongoing': return <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Ongoing</span>;
      case 'closed': return <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">Finished</span>;
      default: return <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">{status}</span>;
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
        <p className="text-gray-400 text-sm">Browse and view schedules</p>
      </div>
      <div className="space-y-4">
        {tournaments.map(tournament => {
          const participants = participantsMap[tournament.id] || [];
          const schedule = scheduleMap[tournament.id] || [];
          const reportedMatches = reportedMatchesMap[tournament.id] || [];

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
                <button onClick={() => setExpandedId(expandedId === tournament.id ? null : tournament.id)} className="text-blue-400 hover:text-blue-300 text-sm">
                  {expandedId === tournament.id ? '▲ Less' : '▼ Details'}
                </button>
              </div>

              {expandedId === tournament.id && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-6">
                  {/* Participants */}
                  <div>
                    <h4 className="text-white font-medium mb-2">Registered {tournament.tournament_type === 'team' ? 'Teams' : 'Players'}</h4>
                    <div className="flex flex-wrap gap-2">
                      {participants.length > 0 ? (
                        participants.map(p => (
                          <span key={p.team_id || p.player_id} className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300">
                            {tournament.tournament_type === 'team' ? (
                              `${p.teams?.name} ${p.teams?.tag ? `[${p.teams.tag}]` : ''}`
                            ) : (
                              p.profiles?.display_name || p.profiles?.handle
                            )}
                            {p.placement && ` (${p.placement})`}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No participants registered yet</span>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <h4 className="text-white font-medium mb-2">Schedule</h4>
                    {schedule.length === 0 ? (
                      <p className="text-gray-500 text-sm">No matches scheduled yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {schedule.map(m => (
                          <div key={m.id} className="bg-gray-800/50 rounded p-2 text-sm flex justify-between items-center">
                            <div className="flex gap-3">
                              <span className="text-white font-medium">{getParticipantName(m.participant_a_id, tournament.id)}</span>
                              <span className="text-gray-400">vs</span>
                              <span className="text-white font-medium">{getParticipantName(m.participant_b_id, tournament.id)}</span>
                            </div>
                            <div className="text-gray-300">{new Date(m.scheduled_time).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bracket */}
                  {tournament.format !== 'round_robin' && reportedMatches.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Bracket</h4>
                      <div className="overflow-x-auto">
                        <BracketRenderer
                          format={tournament.format}
                          reportedMatches={reportedMatches}
                          participants={participants}
                          tournamentType={tournament.tournament_type}
                        />
                      </div>
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