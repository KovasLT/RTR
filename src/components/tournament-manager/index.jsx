import { useState, useEffect, useMemo } from 'react';
import { useTournaments } from '../../hooks/useTournaments.js';
import { supabase } from '../../lib/supabase';
import TournamentCreationWizard from './TournamentCreationWizard';
import TournamentEditForm from './TournamentEditForm';
import OverviewTab from './OverviewTab';
import ScheduleTab from './ScheduleTab';
import MatchPoolTab from './MatchPoolTab';
import StandingsTable from './StandingsTable';
import TournamentList from './TournamentList';
import { getParticipantName } from './utils';

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

  // Bracket state for single and double elimination
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

  const removeParticipant = async (participantId) => {
    if (!confirm(`Remove this ${currentTournament.tournament_type} from the tournament?`)) return;
    try {
      if (currentTournament.tournament_type === 'team') {
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

  const updateMatch = (matchId, field, value) => setScheduledMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: value } : m));
  const addEmptyMatch = () => setScheduledMatches([...scheduledMatches, { id: `m${Date.now()}`, p1: '', p2: '', datetime: '', status: 'scheduled' }]);
  const removeMatch = (matchId) => setScheduledMatches(prev => prev.filter(m => m.id !== matchId));

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

  const saveTournamentState = () => {
    console.log("Saving tournament state (schedule):", scheduledMatches);
    alert("Schedule saved locally. Implement DB push here.");
  };

  const assignMatchToTree = (bracketType, roundIndex, slotIndex, reportedMatchId) => {
    setBracketState(prev => {
      const newBracket = { ...prev };
      newBracket[bracketType][roundIndex].slots[slotIndex].matchId = reportedMatchId;
      return newBracket;
    });
  };

  const saveBracketAssignments = () => {
    console.log("Saving bracket assignments:", bracketState);
    // TODO: persist to DB (e.g., update tournament_brackets table)
    alert("Bracket assignments saved to console (DB integration pending).");
  };

  const standings = useMemo(() => {
    if (currentTournament?.format !== 'round_robin') return [];
    const stats = {};
    participants.forEach(p => {
      const id = p.team_id || p.player_id;
      stats[id] = {
        id,
        name: getParticipantName(id, participants, currentTournament.tournament_type),
        played: 0, w: 0, l: 0, pts: 0
      };
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
        <TournamentCreationWizard form={form} setForm={setForm} onSubmit={handleCreateSubmit} isPending={createTournament?.isPending} />
      )}

      {!isCreating && selectedTournamentId && currentTournament && (
        <div className="space-y-6">
          {activeTab === 'edit' && (
            <TournamentEditForm editForm={editForm} setEditForm={setEditForm} onSubmit={handleUpdateSubmit} />
          )}
          {activeTab === 'overview' && (
            <OverviewTab tournament={currentTournament} participants={participants} loadingParticipants={loadingParticipants} onRemoveParticipant={removeParticipant} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab
              scheduledMatches={scheduledMatches}
              participants={participants}
              tournamentType={currentTournament.tournament_type}
              onUpdateMatch={updateMatch}
              onAddMatch={addEmptyMatch}
              onRemoveMatch={removeMatch}
              onGenerateRoundRobin={currentTournament.format === 'round_robin' ? generateRoundRobinSchedule : null}
              onSave={saveTournamentState}
            />
          )}
          {activeTab === 'matchpool' && (
            <MatchPoolTab matches={reportedMatches} participants={participants} tournamentType={currentTournament.tournament_type} onToggleFlag={toggleFlagMatch} />
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
                      : 'Assign reported matches (non‑flagged) to bracket slots.'}
                  </p>
                </div>
                {currentTournament.format !== 'round_robin' && (
                  <button onClick={saveBracketAssignments} className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded font-bold shadow-lg">
                    Save Tree
                  </button>
                )}
              </div>

              <div className="min-w-[800px]">
                {currentTournament.format === 'round_robin' && <StandingsTable standings={standings} />}

                {currentTournament.format === 'playoffs' && (
                  <div className="mb-10">
                    <div className="flex flex-row justify-between gap-8 py-4 relative">
                      {bracketState.single.map((round, rIndex) => (
                        <div key={round.roundName} className="flex flex-col justify-around flex-1 relative">
                          <h6 className="text-center text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-6 absolute -top-8 w-full">
                            {round.roundName}
                          </h6>
                          {round.slots.map((slot, sIndex) => {
                            const assignedMatch = reportedMatches.find(m => m.id === slot.matchId);
                            return (
                              <div key={`${rIndex}-${sIndex}`} className="my-2 flex flex-col relative z-10 bg-[#1a1c23] border border-gray-700 rounded-lg shadow-md">
                                {rIndex < bracketState.single.length - 1 && (
                                  <div className="absolute w-4 h-[2px] bg-gray-700 -right-4 top-1/2"></div>
                                )}
                                <div className="bg-[#0f1219] border-b border-gray-800 p-1.5 rounded-t-lg">
                                  <select
                                    className="w-full bg-transparent text-[10px] text-indigo-300 font-bold outline-none cursor-pointer"
                                    value={slot.matchId}
                                    onChange={(e) => assignMatchToTree('single', rIndex, sIndex, e.target.value)}
                                  >
                                    <option value="" className="text-gray-500">Select reported match...</option>
                                    {reportedMatches.filter(m => !m.flagged).map((m, idx) => (
                                      <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                                        {getParticipantName(m.team_a_id, participants, currentTournament.tournament_type)} vs {getParticipantName(m.team_b_id, participants, currentTournament.tournament_type)} ({m.score_team_a}-{m.score_team_b})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="p-3 space-y-2">
                                  <div className="flex justify-between text-xs items-center">
                                    <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_a > assignedMatch.score_team_b ? 'text-white font-bold' : 'text-gray-400'}`}>
                                      {assignedMatch ? getParticipantName(assignedMatch.team_a_id, participants, currentTournament.tournament_type) : '---'}
                                    </span>
                                    <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                      {assignedMatch ? assignedMatch.score_team_a : '-'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs items-center">
                                    <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_b > assignedMatch.score_team_a ? 'text-white font-bold' : 'text-gray-400'}`}>
                                      {assignedMatch ? getParticipantName(assignedMatch.team_b_id, participants, currentTournament.tournament_type) : '---'}
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
                )}

                {currentTournament.format === 'double_elimination' && (
                  <div className="space-y-8">
                    {/* Upper Bracket */}
                    <div>
                      <h5 className="text-xs font-bold text-indigo-400 mb-6 uppercase border-b border-gray-800 pb-2 inline-block">Upper Bracket</h5>
                      <div className="flex flex-row justify-between gap-8 py-4 relative">
                        {bracketState.upper.map((round, rIndex) => (
                          <div key={round.roundName} className="flex flex-col justify-around flex-1 relative">
                            <h6 className="text-center text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-6 absolute -top-8 w-full">{round.roundName}</h6>
                            {round.slots.map((slot, sIndex) => {
                              const assignedMatch = reportedMatches.find(m => m.id === slot.matchId);
                              return (
                                <div key={`upper-${rIndex}-${sIndex}`} className="my-2 flex flex-col relative z-10 bg-[#1a1c23] border border-gray-700 rounded-lg shadow-md">
                                  {rIndex < bracketState.upper.length - 1 && <div className="absolute w-4 h-[2px] bg-gray-700 -right-4 top-1/2"></div>}
                                  <div className="bg-[#0f1219] border-b border-gray-800 p-1.5 rounded-t-lg">
                                    <select
                                      className="w-full bg-transparent text-[10px] text-indigo-300 font-bold outline-none cursor-pointer"
                                      value={slot.matchId}
                                      onChange={(e) => assignMatchToTree('upper', rIndex, sIndex, e.target.value)}
                                    >
                                      <option value="">Select reported match...</option>
                                      {reportedMatches.filter(m => !m.flagged).map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {getParticipantName(m.team_a_id, participants, currentTournament.tournament_type)} vs {getParticipantName(m.team_b_id, participants, currentTournament.tournament_type)} ({m.score_team_a}-{m.score_team_b})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="p-3 space-y-2">
                                    <div className="flex justify-between text-xs items-center">
                                      <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_a > assignedMatch.score_team_b ? 'text-white font-bold' : 'text-gray-400'}`}>
                                        {assignedMatch ? getParticipantName(assignedMatch.team_a_id, participants, currentTournament.tournament_type) : '---'}
                                      </span>
                                      <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                        {assignedMatch ? assignedMatch.score_team_a : '-'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                      <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_b > assignedMatch.score_team_a ? 'text-white font-bold' : 'text-gray-400'}`}>
                                        {assignedMatch ? getParticipantName(assignedMatch.team_b_id, participants, currentTournament.tournament_type) : '---'}
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

                    {/* Lower Bracket */}
                    <div>
                      <h5 className="text-xs font-bold text-indigo-400 mb-6 uppercase border-b border-gray-800 pb-2 inline-block">Lower Bracket</h5>
                      <div className="flex flex-row justify-between gap-8 py-4 relative">
                        {bracketState.lower.map((round, rIndex) => (
                          <div key={round.roundName} className="flex flex-col justify-around flex-1 relative">
                            <h6 className="text-center text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-6 absolute -top-8 w-full">{round.roundName}</h6>
                            {round.slots.map((slot, sIndex) => {
                              const assignedMatch = reportedMatches.find(m => m.id === slot.matchId);
                              return (
                                <div key={`lower-${rIndex}-${sIndex}`} className="my-2 flex flex-col relative z-10 bg-[#1a1c23] border border-gray-700 rounded-lg shadow-md">
                                  {rIndex < bracketState.lower.length - 1 && <div className="absolute w-4 h-[2px] bg-gray-700 -right-4 top-1/2"></div>}
                                  <div className="bg-[#0f1219] border-b border-gray-800 p-1.5 rounded-t-lg">
                                    <select
                                      className="w-full bg-transparent text-[10px] text-indigo-300 font-bold outline-none cursor-pointer"
                                      value={slot.matchId}
                                      onChange={(e) => assignMatchToTree('lower', rIndex, sIndex, e.target.value)}
                                    >
                                      <option value="">Select reported match...</option>
                                      {reportedMatches.filter(m => !m.flagged).map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {getParticipantName(m.team_a_id, participants, currentTournament.tournament_type)} vs {getParticipantName(m.team_b_id, participants, currentTournament.tournament_type)} ({m.score_team_a}-{m.score_team_b})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="p-3 space-y-2">
                                    <div className="flex justify-between text-xs items-center">
                                      <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_a > assignedMatch.score_team_b ? 'text-white font-bold' : 'text-gray-400'}`}>
                                        {assignedMatch ? getParticipantName(assignedMatch.team_a_id, participants, currentTournament.tournament_type) : '---'}
                                      </span>
                                      <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                        {assignedMatch ? assignedMatch.score_team_a : '-'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                      <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_b > assignedMatch.score_team_a ? 'text-white font-bold' : 'text-gray-400'}`}>
                                        {assignedMatch ? getParticipantName(assignedMatch.team_b_id, participants, currentTournament.tournament_type) : '---'}
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

                    {/* Grand Finals */}
                    <div>
                      <h5 className="text-xs font-bold text-indigo-400 mb-6 uppercase border-b border-gray-800 pb-2 inline-block">Grand Finals</h5>
                      <div className="flex flex-row justify-start gap-8 py-4 relative">
                        {bracketState.grand.map((round, rIndex) => (
                          <div key={round.roundName} className="flex flex-col justify-around w-64 relative">
                            <h6 className="text-center text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-6">{round.roundName}</h6>
                            {round.slots.map((slot, sIndex) => {
                              const assignedMatch = reportedMatches.find(m => m.id === slot.matchId);
                              return (
                                <div key={`grand-${rIndex}-${sIndex}`} className="my-2 flex flex-col relative z-10 bg-[#1a1c23] border border-gray-700 rounded-lg shadow-md">
                                  <div className="bg-[#0f1219] border-b border-gray-800 p-1.5 rounded-t-lg">
                                    <select
                                      className="w-full bg-transparent text-[10px] text-indigo-300 font-bold outline-none cursor-pointer"
                                      value={slot.matchId}
                                      onChange={(e) => assignMatchToTree('grand', rIndex, sIndex, e.target.value)}
                                    >
                                      <option value="">Select reported match...</option>
                                      {reportedMatches.filter(m => !m.flagged).map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {getParticipantName(m.team_a_id, participants, currentTournament.tournament_type)} vs {getParticipantName(m.team_b_id, participants, currentTournament.tournament_type)} ({m.score_team_a}-{m.score_team_b})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="p-3 space-y-2">
                                    <div className="flex justify-between text-xs items-center">
                                      <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_a > assignedMatch.score_team_b ? 'text-white font-bold' : 'text-gray-400'}`}>
                                        {assignedMatch ? getParticipantName(assignedMatch.team_a_id, participants, currentTournament.tournament_type) : '---'}
                                      </span>
                                      <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                        {assignedMatch ? assignedMatch.score_team_a : '-'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                      <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_b > assignedMatch.score_team_a ? 'text-white font-bold' : 'text-gray-400'}`}>
                                        {assignedMatch ? getParticipantName(assignedMatch.team_b_id, participants, currentTournament.tournament_type) : '---'}
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
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isCreating && !selectedTournamentId && (
        <TournamentList tournaments={tournaments} onSelectTournament={setSelectedTournamentId} onCreateNew={() => setIsCreating(true)} />
      )}
    </div>
  );
}