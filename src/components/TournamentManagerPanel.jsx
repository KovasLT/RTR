import { useState, useEffect } from 'react';
import { useTournaments } from '../hooks/useTournaments.js';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../app-constants';

export default function TournamentManagerPanel({ rating, userId }) {
  const { data: tournaments = [], createTournament, updateTournament } = useTournaments(userId);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [participants, setParticipants] = useState([]); // for selected tournament
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Creation form state (added tournamentType)
  const [form, setForm] = useState({ 
    title: '', 
    tournamentType: 'team',   // 'team' or 'player'
    format: 'round_robin', 
    rewards: '', 
    minElo: '', 
    maxElo: '', 
    start: '', 
    end: '' 
  });

  const [editForm, setEditForm] = useState({
    title: '',
    tournamentType: 'team',
    format: '',
    rewards: '',
    minElo: 0,
    maxElo: 3000,
    start: '',
    end: ''
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
    }
  }, [currentTournament]);

  const fetchParticipants = async (tournamentId, type) => {
    setLoadingParticipants(true);
    try {
      if (type === 'team') {
        const { data, error } = await supabase
          .from('tournament_teams')
          .select(`
            team_id,
            placement,
            teams (id, name, tag)
          `)
          .eq('tournament_id', tournamentId);
        if (!error) setParticipants(data || []);
      } else {
        const { data, error } = await supabase
          .from('tournament_players')
          .select(`
            player_id,
            placement,
            profiles (id, display_name, handle, avatar_url)
          `)
          .eq('tournament_id', tournamentId);
        if (!error) setParticipants(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingParticipants(false);
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
      console.error(err);
      setErrorMsg(err.message || "Failed to create tournament.");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!updateTournament) {
      setErrorMsg("Update not available.");
      return;
    }
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
      setIsEditing(false);
    } catch (err) {
      console.error(err);
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
    setIsEditing(false);
    setErrorMsg(null);
    setParticipants([]);
  };

  return (
    <div className="rtr-card relative min-h-[400px]">
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="fas fa-trophy text-indigo-300"></i>
          {selectedTournamentId && currentTournament
            ? `Managing: ${currentTournament.title} (${currentTournament.tournament_type === 'team' ? '5v5 Team' : '1v1 Player'})`
            : "Tournament Manager Controls Hub"}
        </h3>
        <div className="flex items-center gap-3">
          {selectedTournamentId ? (
            <>
              <button onClick={() => setIsEditing(!isEditing)} className={`text-xs font-semibold rounded px-4 py-1.5 transition-colors ${isEditing ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-600" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
                {isEditing ? 'Cancel Edit' : 'Edit Framework'}
              </button>
              <button onClick={closeManageView} className="text-xs bg-gray-800 border border-gray-600 text-gray-300 hover:border-gray-500 rounded px-4 py-1.5">
                Back to List
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

      {/* Creation Wizard */}
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

      {/* Management Workspace */}
      {!isCreating && selectedTournamentId && currentTournament && (
        <div className="space-y-6">
          {isEditing ? (
            <form onSubmit={handleUpdateSubmit} className="bg-[#151922] border border-gray-800/80 rounded-xl p-5">
              <h4 className="text-xs font-bold text-indigo-400 uppercase mb-4 border-b border-gray-800 pb-2">Edit Tournament</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title</label><input className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label><select className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.tournamentType} onChange={e => setEditForm({...editForm, tournamentType: e.target.value})}><option value="team">5v5 Team</option><option value="player">1v1 Player</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Format</label><select className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.format} onChange={e => setEditForm({...editForm, format: e.target.value})}><option value="round_robin">Round Robin</option><option value="playoffs">Single Elimination</option></select></div>
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
          ) : (
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
          )}

          {/* Participants Section */}
          <div className="border border-gray-800 bg-[#151922] rounded-xl p-5">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-users text-indigo-400"></i> 
              Registered {currentTournament.tournament_type === 'team' ? 'Teams' : 'Players'}
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
                        <span className="text-white">{p.teams?.name} {p.teams?.tag ? `[${p.teams.tag}]` : ''}</span>
                      ) : (
                        <span className="text-white">{p.profiles?.display_name || p.profiles?.handle || 'Unknown'}</span>
                      )}
                      {p.placement && <span className="ml-2 text-xs text-amber-400">Placement: #{p.placement}</span>}
                    </div>
                    <button onClick={() => removeParticipant(p.team_id || p.player_id, currentTournament.tournament_type)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tournament List View */}
      {!isCreating && !selectedTournamentId && (
        <div className="mt-2">
          {tournaments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500 mb-4">No tournaments yet.</p>
              <button onClick={() => setIsCreating(true)} className="text-xs bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 px-4 py-2 rounded">Create First Tournament</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-gray-500 mb-3 uppercase text-[10px]">Managed Tournaments</p>
              {tournaments.map(t => (
                <div key={t.id} className="p-4 bg-[#151922] border border-gray-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-white font-semibold">{t.title}</div>
                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                      <span className="capitalize">{t.tournament_type === 'player' ? '1v1' : '5v5'}</span>
                      <span>•</span>
                      <span>{t.format?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Elo {t.min_elo}-{t.max_elo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${t.status === 'registration' ? 'bg-amber-950/50 text-amber-400 border-amber-900/50' : t.status === 'ongoing' ? 'bg-green-950/50 text-green-400 border-green-900/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{t.status}</span>
                    <button onClick={() => setSelectedTournamentId(t.id)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded px-4 py-2">Manage</button>
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