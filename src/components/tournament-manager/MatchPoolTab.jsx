import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getParticipantName } from './utils';

export default function MatchPoolTab({ tournamentId, participants, tournamentType, onMatchesUpdated }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .not('score_team_a', 'is', null)
      .not('score_team_b', 'is', null)
      .order('created_at', { ascending: false });
    if (!error) setMatches(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const toggleFlag = async (matchId, currentFlag) => {
    const { error } = await supabase
      .from('matches')
      .update({ flagged: !currentFlag })
      .eq('id', matchId);
    if (!error) {
      fetchMatches();
      if (onMatchesUpdated) onMatchesUpdated(tournamentId);
    } else alert(error.message);
  };

  if (loading) return <div className="text-gray-500 text-center py-4">Loading matches...</div>;

  return (
    <div className="bg-[#151922] border border-gray-800 rounded-xl p-5">
      <h4 className="text-sm font-bold text-white mb-3">Reported Matches Pool</h4>
      {matches.length === 0 ? (
        <div className="text-gray-500 text-sm">No reported matches yet.</div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {matches.map(m => (
            <div key={m.id} className={`bg-gray-900 border rounded-lg p-3 flex justify-between items-center ${m.flagged ? 'border-red-800/50 bg-red-950/20' : 'border-gray-700'}`}>
              <div>
                <div className="text-white text-sm">
                  {getParticipantName(m.team_a_id, participants, tournamentType)} vs {getParticipantName(m.team_b_id, participants, tournamentType)}
                </div>
                <div className="text-gray-400 text-xs">Score: {m.score_team_a} - {m.score_team_b} &nbsp;|&nbsp; {new Date(m.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => toggleFlag(m.id, m.flagged)} className={`text-xs px-3 py-1 rounded ${m.flagged ? 'bg-gray-700' : 'bg-red-900/50 text-red-300'}`}>
                {m.flagged ? 'Unflag' : 'Flag'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}