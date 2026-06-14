import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminTasks() {
  const [activeSubTab, setActiveSubTab] = useState('pending');
  const [pendingMatches, setPendingMatches] = useState([]);
  const [flaggedMatches, setFlaggedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editScoreA, setEditScoreA] = useState(0);
  const [editScoreB, setEditScoreB] = useState(0);
  const [editWinner, setEditWinner] = useState('');

  const fetchParticipantNames = async (match) => {
    let teamAName = match.team_a_id?.slice(0, 8) || 'Unknown';
    let teamBName = match.team_b_id?.slice(0, 8) || 'Unknown';
    if (match.team_a_id) {
      const { data: teamData } = await supabase.from('teams').select('name').eq('id', match.team_a_id).single();
      if (teamData) teamAName = teamData.name;
      else {
        const { data: profileData } = await supabase.from('profiles').select('display_name').eq('id', match.team_a_id).single();
        if (profileData) teamAName = profileData.display_name;
      }
    }
    if (match.team_b_id) {
      const { data: teamData } = await supabase.from('teams').select('name').eq('id', match.team_b_id).single();
      if (teamData) teamBName = teamData.name;
      else {
        const { data: profileData } = await supabase.from('profiles').select('display_name').eq('id', match.team_b_id).single();
        if (profileData) teamBName = profileData.display_name;
      }
    }
    return { teamAName, teamBName };
  };

  const fetchPendingMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*, tournament:tournaments(id, title)')
      .eq('approved', false)
      .eq('rejected', false)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      setPendingMatches([]);
      return;
    }
    const enriched = await Promise.all(data.map(async (match) => {
      const { teamAName, teamBName } = await fetchParticipantNames(match);
      return { ...match, teamAName, teamBName };
    }));
    setPendingMatches(enriched);
  };

  const fetchFlaggedMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*, tournament:tournaments(id, title)')
      .eq('flagged', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      setFlaggedMatches([]);
      return;
    }
    const enriched = await Promise.all(data.map(async (match) => {
      const { teamAName, teamBName } = await fetchParticipantNames(match);
      return { ...match, teamAName, teamBName };
    }));
    setFlaggedMatches(enriched);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPendingMatches(), fetchFlaggedMatches()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Approve match: only set approved = true; rating update handled by database trigger
  const approveMatch = async (matchId) => {
    const { data, error } = await supabase
      .from('matches')
      .update({ approved: true })
      .eq('id', matchId)
      .select(); // Require returned data to verify RLS success

    if (error) {
      alert(`Database Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert('Update failed: 0 rows affected. You likely do not have Admin permissions.');
    } else {
      alert('Match approved!');
      await fetchPendingMatches();
    }
  };

  const rejectMatch = async (matchId) => {
    const { data, error } = await supabase
      .from('matches')
      .update({ rejected: true })
      .eq('id', matchId)
      .select();

    if (error) {
      alert(`Database Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert('Update failed: 0 rows affected. You likely do not have Admin permissions.');
    } else {
      alert('Match rejected');
      await fetchPendingMatches();
    }
  };

  const resolveFlag = async (matchId) => {
    const { data, error } = await supabase
      .from('matches')
      .update({ flagged: false })
      .eq('id', matchId)
      .select();

    if (error) {
      alert(`Database Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert('Update failed: 0 rows affected. You likely do not have Admin permissions.');
    } else {
      alert('Flag cleared');
      await fetchFlaggedMatches();
    }
  };

  const startEdit = (match) => {
    setEditingId(match.id);
    setEditScoreA(match.score_team_a || 0);
    setEditScoreB(match.score_team_b || 0);
    setEditWinner(match.winner_id || '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (matchId) => {
    const { data, error } = await supabase
      .from('matches')
      .update({
        score_team_a: editScoreA,
        score_team_b: editScoreB,
        winner_id: editWinner || null,
        flagged: false,
      })
      .eq('id', matchId)
      .select();

    if (error) {
      alert(`Database Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert('Update failed: 0 rows affected. You likely do not have Admin permissions.');
    } else {
      alert('Match updated and flag cleared');
      setEditingId(null);
      await fetchFlaggedMatches();
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading tasks...</div>;

  const formatDate = (matchDate, createdAt) => {
    if (matchDate) return new Date(matchDate).toLocaleDateString();
    if (createdAt) return new Date(createdAt).toLocaleDateString();
    return 'Unknown date';
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
            activeSubTab === 'pending'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Pending Reports ({pendingMatches.length})
        </button>
        <button
          onClick={() => setActiveSubTab('flagged')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
            activeSubTab === 'flagged'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Flagged ({flaggedMatches.length})
        </button>
      </div>

      {activeSubTab === 'pending' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">New Reported Matches (Awaiting Approval)</h3>
          {pendingMatches.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No pending matches.</div>
          ) : (
            pendingMatches.map((match) => (
              <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="text-sm text-gray-400">
                      Tournament: <span className="text-indigo-300 font-medium">{match.tournament?.title || 'N/A'}</span>
                    </div>
                    <div className="text-white font-mono text-lg mt-1">
                      {match.teamAName} vs {match.teamBName}
                    </div>
                    <div className="text-gray-300 mt-1">
                      Score: {match.score_team_a ?? '-'} – {match.score_team_b ?? '-'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Match Date: {formatDate(match.match_date, match.created_at)}
                      {match.match_date && <span className="ml-3">Reported: {new Date(match.created_at).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveMatch(match.id)} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                    <button onClick={() => rejectMatch(match.id)} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'flagged' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Flagged Matches (Require Review)</h3>
          {flaggedMatches.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No flagged matches.</div>
          ) : (
            flaggedMatches.map((match) => (
              <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="text-sm text-gray-400">
                      Tournament: <span className="text-indigo-300 font-medium">{match.tournament?.title || 'N/A'}</span>
                    </div>
                    <div className="text-white font-mono text-lg mt-1">
                      {match.teamAName} vs {match.teamBName}
                    </div>
                    {editingId === match.id ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-3 items-center flex-wrap">
                          <label className="text-sm text-gray-300">Score A:</label>
                          <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-16 text-white" value={editScoreA} onChange={(e) => setEditScoreA(parseInt(e.target.value) || 0)} />
                          <label className="text-sm text-gray-300">Score B:</label>
                          <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-16 text-white" value={editScoreB} onChange={(e) => setEditScoreB(parseInt(e.target.value) || 0)} />
                          <label className="text-sm text-gray-300">Winner ID:</label>
                          <input type="text" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-40 text-white text-sm" placeholder="team_a_id or team_b_id" value={editWinner} onChange={(e) => setEditWinner(e.target.value)} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveEdit(match.id)} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Save & Clear Flag</button>
                          <button onClick={cancelEdit} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-300 mt-1">
                        Score: {match.score_team_a ?? '-'} – {match.score_team_b ?? '-'}
                        {match.winner_id && <span className="ml-3 text-indigo-300">Winner: {match.winner_id.slice(0,8)}</span>}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Match Date: {formatDate(match.match_date, match.created_at)}
                      {match.match_date && <span className="ml-3">Reported: {new Date(match.created_at).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingId !== match.id && (
                      <>
                        <button onClick={() => startEdit(match)} className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Edit</button>
                        <button onClick={() => resolveFlag(match.id)} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Clear Flag</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}