import { useState, useEffect, useMemo } from 'react';
import { useTournaments } from '../../hooks/useTournaments.js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth.jsx';
import TournamentCreationWizard from './TournamentCreationWizard';
import TournamentEditForm from './TournamentEditForm';
import OverviewTab from './OverviewTab';
import ScheduleTab from './ScheduleTab';
import MatchPoolTab from './MatchPoolTab';
import StandingsTable from './StandingsTable';
import BracketRenderer from './BracketRenderer';
import TournamentList from './TournamentList';
import { getParticipantName } from './utils';

// ========== InvitationsTab embedded ==========
const InvitationsTab = ({ tournamentId, tournamentType }) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchInvites = async () => {
    let selectQuery;
    if (tournamentType === 'team') {
      selectQuery = `*, team:teams(id, name, tag)`;
    } else {
      selectQuery = `*, player:profiles(id, display_name, handle)`;
    }
    const { data, error } = await supabase
      .from('tournament_invitations')
      .select(selectQuery)
      .eq('tournament_id', tournamentId);
    if (!error) setInvites(data || []);
  };

  useEffect(() => {
    if (tournamentId) fetchInvites();
  }, [tournamentId]);

  const searchTeams = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, tag, manager_id')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);
    if (!error) setSearchResults(data);
    setLoading(false);
  };

  const searchPlayers = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, handle')
      .ilike('display_name', `%${searchTerm}%`)
      .limit(10);
    if (!error) setSearchResults(data);
    setLoading(false);
  };

  const sendTeamInvite = async (team) => {
    setSending(true);
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('tournament_invitations')
        .insert({
          tournament_id: tournamentId,
          team_id: team.id,
          message: message || null,
          invited_by: user.id,
          status: 'pending'
        })
        .select()
        .single();
      if (inviteError) throw new Error(inviteError.message);

      const managerId = team.manager_id;
      if (managerId) {
        const { data: tournament } = await supabase
          .from('tournaments')
          .select('title, format, start_date')
          .eq('id', tournamentId)
          .single();

        let conversationId;
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${managerId}),and(user1_id.eq.${managerId},user2_id.eq.${user.id})`)
          .maybeSingle();
        if (existing) {
          conversationId = existing.id;
        } else {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({ user1_id: user.id, user2_id: managerId })
            .select()
            .single();
          if (convError) throw new Error(convError.message);
          conversationId = newConv.id;
        }

        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: managerId,
          message: `🏆 **Tournament Invitation**\n\nYour team **${team.name}** has been invited to **${tournament?.title}** (${tournament?.format?.replace('_', ' ') || 'Tournament'}).\n\n${message ? `Message: "${message}"\n\n` : ''}Starts: ${tournament?.start_date}`,
          is_system: true,
          invitation_id: invite.id,
          action_data: {
            tournament_id: tournamentId,
            team_id: team.id,
            invite_id: invite.id,
            tournament_title: tournament?.title,
            is_team_invite: true
          }
        });
      }

      alert('Invitation sent!');
      clearSearch();
      await fetchInvites();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const sendPlayerInvite = async (player) => {
    setSending(true);
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('tournament_invitations')
        .insert({
          tournament_id: tournamentId,
          player_id: player.id,
          message: message || null,
          invited_by: user.id,
          status: 'pending'
        })
        .select()
        .single();
      if (inviteError) throw new Error(inviteError.message);

      const { data: tournament } = await supabase
        .from('tournaments')
        .select('title, format, start_date')
        .eq('id', tournamentId)
        .single();

      let conversationId;
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${player.id}),and(user1_id.eq.${player.id},user2_id.eq.${user.id})`)
        .maybeSingle();
      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ user1_id: user.id, user2_id: player.id })
          .select()
          .single();
        if (convError) throw new Error(convError.message);
        conversationId = newConv.id;
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: player.id,
        message: `🏆 **Tournament Invitation**\n\nYou have been invited to **${tournament?.title}** (${tournament?.format?.replace('_', ' ') || 'Tournament'}).\n\n${message ? `Message: "${message}"\n\n` : ''}Starts: ${tournament?.start_date}`,
        is_system: true,
        invitation_id: invite.id,
        action_data: {
          tournament_id: tournamentId,
          player_id: player.id,
          invite_id: invite.id,
          tournament_title: tournament?.title,
          is_team_invite: false
        }
      });

      alert('Invitation sent!');
      clearSearch();
      await fetchInvites();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setMessage('');
    setSearchResults([]);
  };

  const handleSearch = () => {
    if (tournamentType === 'team') searchTeams();
    else searchPlayers();
  };

  const updateInviteStatus = async (inviteId, newStatus) => {
    const { error } = await supabase
      .from('tournament_invitations')
      .update({ status: newStatus, updated_at: new Date() })
      .eq('id', inviteId);
    if (error) alert(error.message);
    else fetchInvites();
  };

  return (
    <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 animate-fade-in space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white mb-3">Send Invitations to {tournamentType === 'team' ? 'Teams' : 'Players'}</h4>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input type="text" placeholder={tournamentType === 'team' ? 'Search team...' : 'Search player...'} className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded font-bold">Search</button>
        </div>
        <textarea placeholder="Optional message" rows="2" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white mb-3" value={message} onChange={e => setMessage(e.target.value)} />
        {loading && <p className="text-xs text-gray-500">Searching...</p>}
        {searchResults.length > 0 && (
          <div className="space-y-2 mb-4">
            {searchResults.map(item => (
              <div key={item.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                <span className="text-white font-medium">{tournamentType === 'team' ? item.name : (item.display_name || item.handle)}</span>
                <button onClick={() => tournamentType === 'team' ? sendTeamInvite(item) : sendPlayerInvite(item)} disabled={sending} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded">Send Invite</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white mb-3">Sent Invitations</h4>
        {invites.length === 0 ? <p className="text-xs text-gray-500">No invitations sent yet.</p> : (
          <div className="space-y-2">
            {invites.map(inv => (
              <div key={inv.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">{tournamentType === 'team' ? inv.team?.name : inv.player?.display_name}</span>
                  {inv.status === 'pending' && <span className="ml-2 text-yellow-400 text-xs">(pending)</span>}
                  {inv.status === 'accepted' && <span className="ml-2 text-green-400 text-xs">(accepted)</span>}
                  {inv.status === 'rejected' && <span className="ml-2 text-red-400 text-xs">(rejected)</span>}
                  {inv.message && <p className="text-gray-400 text-xs mt-1 italic">"{inv.message}"</p>}
                </div>
                {inv.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateInviteStatus(inv.id, 'accepted')} className="bg-green-700/50 hover:bg-green-700 text-white text-xs px-2 py-1 rounded">Accept</button>
                    <button onClick={() => updateInviteStatus(inv.id, 'rejected')} className="bg-red-700/50 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ========== Main TournamentManagerPanel ==========
export default function TournamentManagerPanel({ rating, userId }) {
  const { user } = useAuth();
  const { data: tournaments = [], createTournament, updateTournament } = useTournaments(userId);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportedMatches, setReportedMatches] = useState([]);
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
    title: '', tournamentType: 'team', format: 'round_robin', rewards: '', minElo: '', maxElo: '', start: '', end: '',
    registrationType: 'open'
  });

  const [editForm, setEditForm] = useState({
    title: '', tournamentType: 'team', format: '', rewards: '', minElo: 0, maxElo: 3000, start: '', end: ''
  });

  const currentTournament = tournaments.find(t => t.id === selectedTournamentId);

  const loadBracketAssignments = async (tournamentId) => {
    const { data, error } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId);
    if (!error && data?.length) {
      const newState = { ...bracketState };
      data.forEach(assign => {
        const { bracket_type, round_index, slot_index, match_id } = assign;
        if (newState[bracket_type]?.[round_index]?.slots?.[slot_index]) {
          newState[bracket_type][round_index].slots[slot_index].matchId = match_id || '';
        }
      });
      setBracketState(newState);
    }
  };

  const fetchParticipants = async (tournamentId, type) => {
    setLoadingParticipants(true);
    try {
      if (type === 'team') {
        const { data: teamEntries, error: teamEntriesError } = await supabase
          .from('tournament_teams')
          .select('team_id, placement')
          .eq('tournament_id', tournamentId);
        if (teamEntriesError) throw teamEntriesError;
        if (!teamEntries?.length) { setParticipants([]); return; }
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
        if (!playerEntries?.length) { setParticipants([]); return; }
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
      console.error(err);
      setErrorMsg(`Failed to load participants: ${err.message}`);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const fetchReportedMatches = async (tournamentId) => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .not('score_team_a', 'is', null)
      .not('score_team_b', 'is', null)
      .order('created_at', { ascending: false });
    if (!error) setReportedMatches(data || []);
  };

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
      fetchReportedMatches(currentTournament.id);
      loadBracketAssignments(currentTournament.id);
      setActiveTab('overview');
    }
  }, [currentTournament]);

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
        registration_type: form.registrationType,
        status: 'registration',
        created_by: user.id
      });
      setIsCreating(false);
      setForm({ title: '', tournamentType: 'team', format: 'round_robin', rewards: '', minElo: '', maxElo: '', start: '', end: '', registrationType: 'open' });
    } catch (err) { setErrorMsg(err.message || "Failed to create tournament."); }
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
    } catch (err) { setErrorMsg(err.message || "Update failed."); }
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
    } catch (err) { alert(err.message); }
  };

  const closeManageView = () => {
    setSelectedTournamentId(null);
    setActiveTab('overview');
    setErrorMsg(null);
    setParticipants([]);
    setReportedMatches([]);
  };

  const assignMatchToTree = (bracketType, roundIndex, slotIndex, reportedMatchId) => {
    setBracketState(prev => {
      const newState = { ...prev };
      newState[bracketType][roundIndex].slots[slotIndex].matchId = reportedMatchId;
      return newState;
    });
  };

  const saveBracketAssignments = async () => {
    const upserts = [];
    for (const [type, rounds] of Object.entries(bracketState)) {
      for (let r = 0; r < rounds.length; r++) {
        for (let s = 0; s < rounds[r].slots.length; s++) {
          const matchId = rounds[r].slots[s].matchId;
          if (matchId && matchId.trim() !== '') {
            upserts.push({ tournament_id: selectedTournamentId, bracket_type: type, round_index: r, slot_index: s, match_id: matchId });
          }
        }
      }
    }
    const { error: delError } = await supabase.from('tournament_brackets').delete().eq('tournament_id', selectedTournamentId);
    if (delError) console.error(delError);
    if (upserts.length) {
      const { error } = await supabase.from('tournament_brackets').insert(upserts);
      if (error) alert(`Error: ${error.message}`);
      else alert(`Saved ${upserts.length} assignments`);
    } else alert('No assignments to save');
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
      const p1 = m.team_a_id, p2 = m.team_b_id, s1 = m.score_team_a, s2 = m.score_team_b;
      if (!stats[p1] || !stats[p2]) return;
      stats[p1].played++; stats[p2].played++;
      if (s1 > s2) { stats[p1].w++; stats[p1].pts += 3; stats[p2].l++; }
      else if (s2 > s1) { stats[p2].w++; stats[p2].pts += 3; stats[p1].l++; }
    });
    return Object.values(stats).sort((a,b) => b.pts - a.pts || b.w - a.w);
  }, [reportedMatches, participants, currentTournament]);

  const renderBracketSection = (bracketArray, bracketKey, title) => {
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
                      <select
                        className="w-full bg-transparent text-[10px] text-indigo-300 font-bold outline-none cursor-pointer"
                        value={slot.matchId}
                        onChange={(e) => assignMatchToTree(bracketKey, rIdx, sIdx, e.target.value)}
                      >
                        <option value="" className="text-gray-500">Select reported match...</option>
                        {reportedMatches.filter(m => !m.flagged).map(m => (
                          <option key={m.id} value={m.id}>
                            {getParticipantName(m.team_a_id, participants, currentTournament.tournament_type)} vs {getParticipantName(m.team_b_id, participants, currentTournament.tournament_type)} ({m.score_team_a}-{m.score_team_b})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_a > assignedMatch.score_team_b ? 'text-white font-bold' : 'text-gray-400'}`}>
                          {assignedMatch ? getParticipantName(assignedMatch.team_a_id, participants, currentTournament.tournament_type) : '---'}
                        </span>
                        <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">{assignedMatch ? assignedMatch.score_team_a : '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={`truncate w-3/4 ${assignedMatch && assignedMatch.score_team_b > assignedMatch.score_team_a ? 'text-white font-bold' : 'text-gray-400'}`}>
                          {assignedMatch ? getParticipantName(assignedMatch.team_b_id, participants, currentTournament.tournament_type) : '---'}
                        </span>
                        <span className="font-mono text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">{assignedMatch ? assignedMatch.score_team_b : '-'}</span>
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
                <button onClick={() => setActiveTab('invitations')} className={`text-xs px-3 py-1.5 rounded transition-colors font-semibold ${activeTab === 'invitations' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Invitations</button>
              </div>
              <button onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')} className={`text-xs font-semibold rounded px-4 py-1.5 transition-colors border ${activeTab === 'edit' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700'}`}>
                {activeTab === 'edit' ? 'Cancel' : 'Edit Rules'}
              </button>
              <button onClick={closeManageView} className="text-xs bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/40 rounded px-4 py-1.5 font-semibold">Close</button>
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
          {activeTab === 'edit' && <TournamentEditForm editForm={editForm} setEditForm={setEditForm} onSubmit={handleUpdateSubmit} />}
          {activeTab === 'overview' && <OverviewTab tournament={currentTournament} participants={participants} loadingParticipants={loadingParticipants} onRemoveParticipant={removeParticipant} />}
          {activeTab === 'schedule' && (
            <ScheduleTab
              tournamentId={selectedTournamentId}
              tournamentType={currentTournament.tournament_type}
              participants={participants}
            />
          )}
          {activeTab === 'matchpool' && (
            <MatchPoolTab
              tournamentId={selectedTournamentId}
              participants={participants}
              tournamentType={currentTournament.tournament_type}
            />
          )}
          {activeTab === 'invitations' && <InvitationsTab tournamentId={selectedTournamentId} tournamentType={currentTournament.tournament_type} />}

          {activeTab === 'bracket' && (
            <div className="bg-[#151922] border border-gray-800 rounded-xl p-6 overflow-x-auto animate-fade-in">
              <div className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4 min-w-[800px]">
                <div>
                  <h4 className="text-sm font-bold text-white capitalize">{currentTournament.format.replace('_', ' ')} Layout</h4>
                  <p className="text-xs text-gray-500">{currentTournament.format === 'round_robin' ? 'Standings' : 'Assign reported matches to bracket slots.'}</p>
                </div>
                {currentTournament.format !== 'round_robin' && (
                  <button onClick={saveBracketAssignments} className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded font-bold shadow-lg">Save Tree</button>
                )}
              </div>
              <div className="min-w-[800px]">
                {currentTournament.format === 'round_robin' && <StandingsTable standings={standings} />}
                {currentTournament.format === 'playoffs' && renderBracketSection(bracketState.single, 'single')}
                {currentTournament.format === 'double_elimination' && (
                  <div className="space-y-8">
                    {renderBracketSection(bracketState.upper, 'upper', 'Upper Bracket')}
                    <div className="h-px w-full bg-gray-800/80"></div>
                    {renderBracketSection(bracketState.lower, 'lower', 'Lower Bracket')}
                    <div className="h-px w-full bg-gray-800/80"></div>
                    {renderBracketSection(bracketState.grand, 'grand', 'Grand Finals')}
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