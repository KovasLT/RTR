import { useState, useEffect, useMemo } from 'react';
import { useTournaments } from '../hooks/useTournaments.js';
import { supabase } from '../lib/supabase';

export default function TournamentManagerPanel({ rating, userId }) {
  const { data: tournaments = [], createTournament, updateTournament } = useTournaments(userId);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [reportedMatches, setReportedMatches] = useState([]);

  // Bracket state
  const [bracketState, setBracketState] = useState({
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
  });

  const [form, setForm] = useState({ 
    title: '', tournamentType: 'team', format: 'round_robin', rewards: '', minElo: '', maxElo: '', start: '', end: '' 
  });

  const [editForm, setEditForm] = useState({
    title: '', tournamentType: 'team', format: '', rewards: '', minElo: 0, maxElo: 3000, start: '', end: ''
  });

  const currentTournament = tournaments.find(t => t.id === selectedTournamentId);

  useEffect(() => {
    if (currentTournament) {
      setEditForm({
        title: currentTournament.title || '',
        tournamentType: currentTournament.tournament_type || 'team',
        format: currentTournament.format || 'round_robin',
        rewards: currentTournament.description || '',
        minElo: currentTournament.min_elo || 0,
        maxElo: currentTournament.max_elo || 3000,
        start: currentTournament.start_date || '',
        end: currentTournament.end_date || ''
      });
      fetchParticipants(currentTournament.id, currentTournament.tournament_type);
      fetchMatches(currentTournament.id);
      setActiveTab('overview');
    }
  }, [currentTournament]);

  const fetchParticipants = async (tournamentId, type) => {
    setLoadingParticipants(true);
    try {
      if (type === 'team') {
        const { data: teamEntries, error: teamEntriesError } = await supabase
          .from('tournament_teams')
          .select('team_id, placement')
          .eq('tournament_id', tournamentId);
        if (teamEntriesError) throw teamEntriesError;
        if (!teamEntries || teamEntries.length === 0) {
          setParticipants([]);
          return;
        }
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
        setParticipants(merged);
      } else {
        const { data: playerEntries, error: playerEntriesError } = await supabase
          .from('tournament_players')
          .select('player_id, placement')
          .eq('tournament_id', tournamentId);
        if (playerEntriesError) throw playerEntriesError;
        if (!playerEntries || playerEntries.length === 0) {
          setParticipants([]);
          return;
        }
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
        setParticipants(merged);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
      setErrorMsg(`Failed to load participants: ${err.message}`);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const fetchMatches = async (tournamentId) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId);
      if (error) throw error;
      const matchesWithFlag = (data || []).map(m => ({ ...m, flagged: m.flagged || false }));
      setReportedMatches(matchesWithFlag);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setErrorMsg(`Failed to load matches: ${err.message}`);
    }
  };

  const toggleFlagMatch = async (matchId, currentFlag) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ flagged: !currentFlag })
        .eq('id', matchId);
      if (error) throw error;
      setReportedMatches(prev => prev.map(m => m.id === matchId ? { ...m, flagged: !currentFlag } : m));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createTournament.mutateAsync({
        title: form.title,
        tournament_type: form.tournamentType,
        description: form.rewards,
        format: form.format,
        min_elo: parseInt(form.minElo) || 0,
        max_elo: parseInt(form.maxElo) || 3000,
        start_date: form.start,
        end_date: form.end,
        status: 'registration'
      });
      setIsCreating(false);
      setForm({ title: '', tournamentType: 'team', format: 'round_robin', rewards: '', minElo: '', maxElo: '', start: '', end: '' });
    } catch (err) {
      setErrorMsg(err.message || "Failed to create tournament.");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!updateTournament) return;
    try {
      await updateTournament.mutateAsync({
        id: selectedTournamentId,
        title: editForm.title,
        tournament_type: editForm.tournamentType,
        description: editForm.rewards,
        format: editForm.format,
        min_elo: parseInt(editForm.minElo) || 0,
        max_elo: parseInt(editForm.maxElo) || 3000,
        start_date: editForm.start,
        end_date: editForm.end,
      });
      setActiveTab('overview');
    } catch (err) {
      setErrorMsg(err.message || "Update failed.");
    }
  };

  const removeParticipant = async (participantId, type) => {
    if (!confirm(`Remove this ${type} from the tournament?`)) return;
    try {
      if (type === 'team') {
        await supabase.from('tournament_teams').delete().eq('team_id', participantId).eq('tournament_id', selectedTournamentId);
      } else {
        await supabase.from('tournament_players').delete().eq('player_id', participantId).eq('tournament_id', selectedTournamentId);
      }
      fetchParticipants(selectedTournamentId, currentTournament.tournament_type);
    } catch (err) {
      alert(err.message);
    }
  };

  const closeManageView = () => {
    setSelectedTournamentId(null);
    setActiveTab('overview');
    setErrorMsg(null);
    setParticipants([]);
    setScheduledMatches([]);
    setReportedMatches([]);
  };

  const getParticipantName = (id) => {
    if (!id) return "TBD";
    const p = participants.find(part => (part.team_id === id || part.player_id === id));
    if (!p) return "Unknown";
    if (currentTournament?.tournament_type === 'team') {
      return `${p.teams?.name || '?'} ${p.teams?.tag ? `[${p.teams.tag}]` : ''}`;
    } else {
      return p.profiles?.display_name || p.profiles?.handle || 'Unknown Player';
    }
  };

  const updateMatch = (matchId, field, value) => setScheduledMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: value } : m));
  const addEmptyMatch = () => setScheduledMatches([...scheduledMatches, { id: `m${Date.now()}`, p1: '', p2: '', datetime: '', status: 'scheduled' }]);

  const generateRoundRobinSchedule = () => {
    const participantIds = participants.map(p => p.team_id || p.player_id);
    const fixtures = [];
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        fixtures.push({
          id: `rr_${participantIds[i]}_${participantIds[j]}_${Date.now()}_${i}_${j}`,
          p1: participantIds[i],
          p2: participantIds[j],
          datetime: '',
          status: 'scheduled'
        });
      }
    }
    setScheduledMatches(fixtures);
  };

  const assignMatchToTree = (bracketType, roundIndex, slotIndex, reportedMatchId) => {
    const newBracket = { ...bracketState };
    newBracket[bracketType][roundIndex].slots[slotIndex].matchId = reportedMatchId;
    setBracketState(newBracket);
  };

  const saveTournamentState = () => {
    console.log("Saving bracket assignments:", bracketState);
    alert("Bracket assignments saved locally. Implement DB push here.");
  };

  const standings = useMemo(() => {
    if (currentTournament?.format !== 'round_robin') return [];
    const stats = {};
    participants.forEach(p => {
      const id = p.team_id || p.player_id;
      stats[id] = { id, name: getParticipantName(id), played: 0, w: 0, l: 0, pts: 0 };
    });
    reportedMatches.forEach(m => {
      if (m.flagged) return;
      const p1Id = m.team_a_id;
      const p2Id = m.team_b_id;
      const score1 = m.score_team_a;
      const score2 = m.score_team_b;
      if (stats[p1Id] && stats[p2Id] && (score1 > 0 || score2 > 0)) {
        stats[p1Id].played++;
        stats[p2Id].played++;
        if (score1 > score2) {
          stats[p1Id].w++;
          stats[p1Id].pts += 3;
          stats[p2Id].l++;
        } else if (score2 > score1) {
          stats[p2Id].w++;
          stats[p2Id].pts += 3;
          stats[p1Id].l++;
        }
      }
    });
    return Object.values(stats).sort((a, b) => b.pts - a.pts || (b.w - a.w));
  }, [reportedMatches, participants, currentTournament]);

  const renderBracketSection = (bracketArray, bracketKey, title) => {
    const availableMatches = reportedMatches.filter(m => !m.flagged);
    return (
      <div className="mb-10">
        {title && <h5 className="text-xs font-bold text-indigo-400 mb-6 uppercase border-b border-gray-800 pb-2 inline-block">{title}</h5>}
        <div className="flex flex-row justify-between gap-8 py-4 relative">
          {bracketArray.map((round, rIndex) => (
            <div key={round.roundName} className="flex flex-col justify-around flex-1 relative">
              <h6 className="text-center text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-6 absolute -top-8 w-full">{round.roundName}</h6>
              {round.slots.map((slot, sIndex) => {
                const reportedMatch = reportedMatches.find(rm => rm.id === slot.matchId);
                return (
                  <div key={`${rIndex}-${sIndex}`} className="my-2 flex flex-col relative z-10 bg-[#1a1c23] border border-gray-700 rounded-lg shadow-md hover:border-indigo-500/50 transition-colors">
                    {rIndex < bracketArray.length - 1 && <div className="absolute w-4 h-[2px] bg-gray-700 -right-4 top-1/2"></div>}
                    <div className="bg-[#0f1219] border-b border-gray-800 p-1.5 rounded-t-lg">
                      <select 
                        className="w-full bg-transparent text-[10px] text-indigo-300 font-bold outline-none cursor-pointer"
                        value={slot.matchId}
                        onChange={(e) => assignMatchToTree(bracketKey, rIndex, sIndex, e.target.value)}
                      >
                        <option value="" className="text-gray-500">Select reported match...</option>
                        {availableMatches.map((m, idx) => (
                          <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                            {getParticipantName(m.team_a_id)} vs {getParticipantName(m.team_b_id)} ({m.score_team_a}-{m.score_team_b})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between text-xs items-center">
                        <span className={`truncate w-3/4 ${reportedMatch && reportedMatch.score_team_a > reportedMatch.score_team_b ? 'text-white font-bold' : 'text-gray-400'}`}>
                          {reportedMatch ? getParticipantName(reportedMatch.team_a_id) : '---'}
                        </span>
                        <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">{reportedMatch ? reportedMatch.score_team_a : '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className={`truncate w-3/4 ${reportedMatch && reportedMatch.score_team_b > reportedMatch.score_team_a ? 'text-white font-bold' : 'text-gray-400'}`}>
                          {reportedMatch ? getParticipantName(reportedMatch.team_b_id) : '---'}
                        </span>
                        <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">{reportedMatch ? reportedMatch.score_team_b : '-'}</span>
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

  return (
    <div className="rtr-card relative min-h-[400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-800 pb-4 gap-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="fas fa-trophy text-indigo-300"></i>
          {selectedTournamentId && currentTournament ? `Managing: ${currentTournament.title}` : "Tournament Manager Controls Hub"}
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTournamentId ? (
            <>
              <div className="flex bg-[#0f1219] border border-gray-800 rounded-lg p-1 mr-2">
                <button onClick={() => setActiveTab('overview')} className={`text-xs px-3 py-1.5 rounded transition-colors font-semibold ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Overview</button>
                <button onClick={() => setActiveTab('schedule')} className={`text-xs px-3 py-1.5 rounded transition-colors font-semibold ${activeTab === 'schedule' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Schedule</button>
                <button onClick={() => setActiveTab('matchpool')} className={`text-xs px-3 py-1.5 rounded transition-colors font-semibold ${activeTab === 'matchpool' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Match Pool</button>
                <button onClick={() => setActiveTab('bracket')} className={`text-xs px-3 py-1.5 rounded transition-colors font-semibold ${activeTab === 'bracket' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                  {currentTournament?.format === 'round_robin' ? 'Standings' : 'Layout'}
                </button>
              </div>
              <button onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')} className={`text-xs font-semibold rounded px-4 py-1.5 transition-colors border ${activeTab === 'edit' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700'}`}>
                {activeTab === 'edit' ? 'Cancel' : 'Edit Rules'}
              </button>
              <button onClick={closeManageView} className="text-xs bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/40 rounded px-4 py-1.5 font-semibold">
                Close
              </button>
            </>
          ) : (
            <>
              {rating != null && <span className="text-indigo-300 font-mono font-bold text-sm mr-2 hidden sm:inline">Rating: {rating}</span>}
              <button onClick={() => { setIsCreating(!isCreating); setErrorMsg(null); }} className={`text-xs font-semibold rounded px-4 py-1.5 transition-colors ${isCreating ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
                {isCreating ? "Back to Dashboard" : "+ Create New Tournament"}
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-lg text-sm">{errorMsg}</div>}

      {isCreating && !selectedTournamentId && (
        <form onSubmit={handleCreateSubmit} className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Competition Title</label>
              <input required placeholder="e.g. Summer Skirmish 2026" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tournament Type</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.tournamentType} onChange={e => setForm({...form, tournamentType: e.target.value})}>
                <option value="team">5v5 (Team)</option>
                <option value="player">1v1 (Player)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Format Scheme</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.format} onChange={e => setForm({...form, format: e.target.value})}>
                <option value="round_robin">Round Robin</option>
                <option value="playoffs">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rewards / Description</label>
              <input placeholder="Prizes, rules..." className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.rewards} onChange={e => setForm({...form, rewards: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Elo</label><input type="number" placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.minElo} onChange={e => setForm({...form, minElo: e.target.value})} /></div>
            <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Elo</label><input type="number" placeholder="3000" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.maxElo} onChange={e => setForm({...form, maxElo: e.target.value})} /></div>
            <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Date</label><input type="date" required className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.start} onChange={e => setForm({...form, start: e.target.value})} /></div>
            <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Date</label><input type="date" required className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.end} onChange={e => setForm({...form, end: e.target.value})} /></div>
          </div>
          <button type="submit" disabled={createTournament?.isPending} className="w-full mt-4 text-sm font-bold bg-green-600 hover:bg-green-500 text-white rounded py-2.5">Create Tournament</button>
        </form>
      )}

      {!isCreating && selectedTournamentId && currentTournament && (
        <div className="space-y-6">
          
          {activeTab === 'edit' && (
            <form onSubmit={handleUpdateSubmit} className="bg-[#151922] border border-gray-800/80 rounded-xl p-5 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-400 uppercase mb-4 border-b border-gray-800 pb-2">Edit Tournament</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title</label><input className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label><select className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.tournamentType} onChange={e => setEditForm({...editForm, tournamentType: e.target.value})}><option value="team">5v5 Team</option><option value="player">1v1 Player</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Format</label><select className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.format} onChange={e => setEditForm({...editForm, format: e.target.value})}><option value="round_robin">Round Robin</option><option value="playoffs">Single Elimination</option><option value="double_elimination">Double Elimination</option></select></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rewards</label><input className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.rewards} onChange={e => setEditForm({...editForm, rewards: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Elo</label><input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.minElo} onChange={e => setEditForm({...editForm, minElo: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Elo</label><input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.maxElo} onChange={e => setEditForm({...editForm, maxElo: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start</label><input type="date" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.start} onChange={e => setEditForm({...editForm, start: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End</label><input type="date" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.end} onChange={e => setEditForm({...editForm, end: e.target.value})} /></div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Save Changes</button>
            </form>
          )}

          {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-6">
              <div className="bg-[#1a1c23] border border-gray-800/80 rounded-xl p-5">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-4">Tournament Info</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><div className="text-gray-500 text-xs">Type</div><div className="text-white">{currentTournament.tournament_type === 'player' ? '1v1 Player' : '5v5 Team'}</div></div>
                  <div><div className="text-gray-500 text-xs">Format</div><div className="text-white capitalize">{currentTournament.format?.replace('_', ' ')}</div></div>
                  <div><div className="text-gray-500 text-xs">Elo Range</div><div className="text-white">{currentTournament.min_elo} – {currentTournament.max_elo}</div></div>
                  <div><div className="text-gray-500 text-xs">Start</div><div className="text-white">{currentTournament.start_date || 'TBD'}</div></div>
                  <div><div className="text-gray-500 text-xs">End</div><div className="text-white">{currentTournament.end_date || 'TBD'}</div></div>
                  <div className="col-span-2"><div className="text-gray-500 text-xs">Description</div><div className="text-gray-300">{currentTournament.description || '—'}</div></div>
                </div>
              </div>

              <div className="border border-gray-800 bg-[#151922] rounded-xl p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <i className="fas fa-users text-indigo-400"></i> Registered {currentTournament.tournament_type === 'team' ? 'Teams' : 'Players'}
                </h4>
                {loadingParticipants ? (
                  <div className="text-xs text-gray-500">Loading...</div>
                ) : participants.length === 0 ? (
                  <div className="text-xs text-gray-500">No participants yet.</div>
                ) : (
                  <div className="space-y-2">
                    {participants.map(p => (
                      <div key={p.team_id || p.player_id} className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0">
                        <div>
                          {currentTournament.tournament_type === 'team' ? (
                            <span className="text-white font-semibold">{p.teams?.name} {p.teams?.tag ? <span className="text-gray-400 font-normal">[{p.teams.tag}]</span> : ''}</span>
                          ) : (
                            <span className="text-white font-semibold">{p.profiles?.display_name || p.profiles?.handle || 'Unknown'}</span>
                          )}
                          {p.placement && <span className="ml-2 text-xs text-amber-400">Placement: #{p.placement}</span>}
                        </div>
                        <button onClick={() => removeParticipant(p.team_id || p.player_id, currentTournament.tournament_type)} className="text-xs text-red-400 hover:text-red-300 bg-red-950/30 px-2 py-1 rounded">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 animate-fade-in">
              <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4 flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white"><i className="fas fa-calendar-alt text-indigo-400 mr-2"></i>Schedule & Results</h4>
                  <p className="text-xs text-gray-500 mt-1">Set match dates/times. Scores are managed via the Match Pool.</p>
                </div>
                <div className="flex gap-2">
                  {currentTournament.format === 'round_robin' && participants.length > 0 && (
                    <button onClick={generateRoundRobinSchedule} className="bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded font-bold">Propose Schedule</button>
                  )}
                  <button onClick={addEmptyMatch} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-xs px-3 py-1.5 rounded font-bold">+ Add Match</button>
                  <button onClick={saveTournamentState} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded font-bold">Save Data</button>
                </div>
              </div>

              {scheduledMatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
                  No matches scheduled yet. Use "Propose Schedule" for round robin or add manually.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {scheduledMatches.map((match, index) => (
                    <div key={match.id} className="bg-gray-900 border border-gray-800 p-3 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-3 items-center hover:border-gray-700 transition-colors">
                      <div className="lg:col-span-1 text-[10px] text-gray-500 font-mono font-bold">MATCH {index + 1}</div>
                      <div className="lg:col-span-4">
                        <select className="w-full bg-gray-800 text-xs text-white p-2 rounded border border-gray-700" value={match.p1} onChange={(e) => updateMatch(match.id, 'p1', e.target.value)}>
                          <option value="">Select Participant</option>
                          {participants.map(p => {
                            const id = p.team_id || p.player_id;
                            return <option key={id} value={id}>{getParticipantName(id)}</option>
                          })}
                        </select>
                      </div>
                      <div className="lg:col-span-1 flex justify-center text-gray-600 text-[10px] font-bold">VS</div>
                      <div className="lg:col-span-4">
                        <select className="w-full bg-gray-800 text-xs text-white p-2 rounded border border-gray-700" value={match.p2} onChange={(e) => updateMatch(match.id, 'p2', e.target.value)}>
                          <option value="">Select Participant</option>
                          {participants.map(p => {
                            const id = p.team_id || p.player_id;
                            return <option key={id} value={id}>{getParticipantName(id)}</option>
                          })}
                        </select>
                      </div>
                      <div className="lg:col-span-2">
                        <input type="datetime-local" className="w-full bg-gray-800 text-[10px] text-white p-2 rounded border border-gray-700" value={match.datetime} onChange={(e) => updateMatch(match.id, 'datetime', e.target.value)} />
                      </div>
                      <div className="lg:col-span-1">
                        <button onClick={() => setScheduledMatches(prev => prev.filter(m => m.id !== match.id))} className="text-red-500 hover:text-red-400 p-1"><i className="fas fa-trash text-xs"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'matchpool' && (
            <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 animate-fade-in">
              <div className="mb-4 border-b border-gray-800 pb-4">
                <h4 className="text-sm font-bold text-white"><i className="fas fa-list-ul text-indigo-400 mr-2"></i>Reported Matches Pool</h4>
                <p className="text-xs text-gray-500 mt-1">Flag any match that is incorrect – flagged matches will NOT affect standings or bracket assignments.</p>
              </div>
              {reportedMatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">No reported matches for this tournament yet.</div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {reportedMatches.map(m => (
                    <div key={m.id} className={`bg-gray-900 border rounded-lg p-3 flex justify-between items-center ${m.flagged ? 'border-red-800/50 bg-red-950/20' : 'border-gray-700'}`}>
                      <div className="flex-1">
                        <div className="text-sm font-mono">
                          <span className="text-white">{getParticipantName(m.team_a_id)}</span>
                          <span className="mx-2 text-gray-500">vs</span>
                          <span className="text-white">{getParticipantName(m.team_b_id)}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Score: {m.score_team_a} - {m.score_team_b} &nbsp;|&nbsp;
                          Reported: {new Date(m.created_at).toLocaleString()} &nbsp;|&nbsp;
                          Status: {m.status}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFlagMatch(m.id, m.flagged)}
                        className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors ${m.flagged ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-red-900/50 text-red-300 hover:bg-red-800/70'}`}
                      >
                        {m.flagged ? 'Mark as Valid' : 'Flag as FALSE'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bracket' && (
            <div className="bg-[#151922] border border-gray-800 rounded-xl p-6 overflow-x-auto animate-fade-in">
              <div className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4 min-w-[800px]">
                <div>
                  <h4 className="text-sm font-bold text-white capitalize">
                    <i className="fas fa-sitemap text-indigo-400 mr-2"></i> 
                    {currentTournament.format.replace('_', ' ')} Layout
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentTournament.format === 'round_robin' 
                      ? 'Standings based on non-flagged matches from the Match Pool.' 
                      : 'Assign reported matches to bracket slots.'}
                  </p>
                </div>
                {currentTournament.format !== 'round_robin' && (
                  <button onClick={saveTournamentState} className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded font-bold shadow-lg">Save Tree</button>
                )}
              </div>

              <div className="min-w-[800px]">
                {currentTournament.format === 'round_robin' && (
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Participant</th>
                        <th className="px-4 py-3 text-center">Played</th>
                        <th className="px-4 py-3 text-center">W</th>
                        <th className="px-4 py-3 text-center">L</th>
                        <th className="px-4 py-3 text-center text-indigo-400">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-6 text-gray-600">
                            No data. Add match scores via Match Pool tab.
                          </td>
                        </tr>
                      ) : (
                        standings.map((stat, idx) => (
                          <tr key={stat.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                            <td className="px-4 py-3 font-bold text-gray-500">#{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-white">{stat.name}</td>
                            <td className="px-4 py-3 text-center">{stat.played}</td>
                            <td className="px-4 py-3 text-center text-green-500">{stat.w}</td>
                            <td className="px-4 py-3 text-center text-red-500">{stat.l}</td>
                            <td className="px-4 py-3 text-center font-bold text-indigo-400">{stat.pts}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {currentTournament.format === 'playoffs' && renderBracketSection(bracketState.single, 'single')}

                {currentTournament.format === 'double_elimination' && (
                  <div className="space-y-8">
                    {renderBracketSection(bracketState.upper, 'upper', 'Upper Bracket')}
                    <div className="h-[1px] w-full bg-gray-800/80 my-4"></div>
                    {renderBracketSection(bracketState.lower, 'lower', 'Lower Bracket')}
                    <div className="h-[1px] w-full bg-gray-800/80 my-4"></div>
                    {renderBracketSection(bracketState.grand, 'grand', 'Grand Finals')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isCreating && !selectedTournamentId && (
        <div className="mt-2 animate-fade-in">
          {tournaments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500 mb-4">No tournaments yet.</p>
              <button onClick={() => setIsCreating(true)} className="text-xs bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 px-4 py-2 rounded">Create First Tournament</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-gray-500 mb-3 uppercase text-[10px]">Managed Tournaments</p>
              {tournaments.map(t => (
                <div key={t.id} className="p-4 bg-[#151922] border border-gray-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-700 transition-colors">
                  <div>
                    <div className="text-white font-semibold">{t.title}</div>
                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                      <span className="capitalize font-bold text-indigo-400">{t.tournament_type === 'player' ? '1v1' : '5v5'}</span>
                      <span>•</span>
                      <span>{t.format?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Elo {t.min_elo}-{t.max_elo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${t.status === 'registration' ? 'bg-amber-950/50 text-amber-400 border-amber-900/50' : t.status === 'ongoing' ? 'bg-green-950/50 text-green-400 border-green-900/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{t.status}</span>
                    <button onClick={() => setSelectedTournamentId(t.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-2 shadow-md">Manage</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}