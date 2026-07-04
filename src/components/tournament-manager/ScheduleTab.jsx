import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getParticipantName } from './utils';

export default function ScheduleTab({ tournamentId, tournamentType, participants }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMatches = async () => {
    if (!tournamentId) return;
    const { data, error } = await supabase
      .from('scheduled_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('scheduled_time', { ascending: true });
    if (!error) setMatches(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const addEmptyMatch = () => {
    setMatches(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        participant_a_id: '',
        participant_b_id: '',
        scheduled_time: '',
        round: null,
        match_order: prev.length + 1,
        status: 'pending'
      }
    ]);
  };

  const updateMatch = (matchId, field, value) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: value } : m));
  };

  const removeMatch = async (matchId) => {
    if (matchId.startsWith('temp-')) {
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } else {
      await supabase.from('scheduled_matches').delete().eq('id', matchId);
      fetchMatches();
    }
  };

  const saveAll = async () => {
    setSaving(true);
    const newMatches = matches.filter(m => m.id.startsWith('temp-'));
    const existingMatches = matches.filter(m => !m.id.startsWith('temp-'));
    for (const match of newMatches) {
      if (!match.participant_a_id || !match.participant_b_id || !match.scheduled_time) {
        alert('Please fill both participants and time for new matches');
        setSaving(false);
        return;
      }
      const { error } = await supabase.from('scheduled_matches').insert({
        tournament_id: tournamentId,
        participant_a_id: match.participant_a_id,
        participant_b_id: match.participant_b_id,
        scheduled_time: match.scheduled_time,
        round: match.round,
        match_order: match.match_order,
        status: match.status
      });
      if (error) console.error('Insert error:', error);
    }
    for (const match of existingMatches) {
      await supabase.from('scheduled_matches').update({
        participant_a_id: match.participant_a_id,
        participant_b_id: match.participant_b_id,
        scheduled_time: match.scheduled_time,
        round: match.round,
        match_order: match.match_order,
        status: match.status
      }).eq('id', match.id);
    }
    await fetchMatches();
    setSaving(false);
    alert('Schedule saved');
  };

  const getParticipantNameById = (id) => {
    const p = participants.find(p => (p.team_id === id || p.player_id === id));
    if (!p) return 'Select...';
    return tournamentType === 'team' ? p.teams?.name : (p.profiles?.display_name || p.profiles?.handle);
  };

  if (loading) return <div className="text-gray-500 text-center py-4">Loading schedule...</div>;

  return (
    <div className="bg-[#151922] border border-gray-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-white">Schedule</h4>
        <div className="flex gap-2">
          <button onClick={addEmptyMatch} className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded">+ Add Match</button>
          <button onClick={saveAll} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded">Save All</button>
        </div>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {matches.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">No scheduled matches.</div>
        ) : (
          matches.map((match, idx) => (
            <div key={match.id} className="bg-gray-900 p-3 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <div className="md:col-span-1 text-xs text-gray-500">Match {idx+1}</div>
              <div className="md:col-span-4">
                <select className="w-full bg-gray-800 text-sm text-white p-2 rounded" value={match.participant_a_id} onChange={e => updateMatch(match.id, 'participant_a_id', e.target.value)}>
                  <option value="">Select participant</option>
                  {participants.map(p => {
                    const id = p.team_id || p.player_id;
                    return <option key={id} value={id}>{getParticipantNameById(id)}</option>;
                  })}
                </select>
              </div>
              <div className="md:col-span-1 text-center text-gray-500 text-xs">VS</div>
              <div className="md:col-span-4">
                <select className="w-full bg-gray-800 text-sm text-white p-2 rounded" value={match.participant_b_id} onChange={e => updateMatch(match.id, 'participant_b_id', e.target.value)}>
                  <option value="">Select participant</option>
                  {participants.map(p => {
                    const id = p.team_id || p.player_id;
                    return <option key={id} value={id}>{getParticipantNameById(id)}</option>;
                  })}
                </select>
              </div>
              <div className="md:col-span-2">
                <input type="datetime-local" className="w-full bg-gray-800 text-sm text-white p-2 rounded" value={match.scheduled_time ? new Date(match.scheduled_time).toISOString().slice(0,16) : ''} onChange={e => updateMatch(match.id, 'scheduled_time', e.target.value)} />
              </div>
              <div className="md:col-span-1 text-right">
                <button onClick={() => removeMatch(match.id)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}