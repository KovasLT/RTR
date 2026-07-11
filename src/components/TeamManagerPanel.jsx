import { useState, useEffect } from 'react';
import { useTournaments } from '../hooks/useTournaments';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import RatingBadge from './RatingBadge';
import { APP_CONSTANTS } from '../app-constants';

const D = APP_CONSTANTS.DASHBOARD;

export default function TournamentManagerPanel({ rating, userId }) {
  const { user } = useAuth();
  const { data: tournaments, isLoading, createTournament, updateTournament, closeTournament } = useTournaments(userId);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    format: 'playoffs',
    tournament_type: 'team',
    registration_type: 'open',
    min_elo: 0,
    max_elo: 3000,
    start_date: '',
    end_date: '',
    status: 'registration',
  });
  const [error, setError] = useState(null);

  // --- Award / Finalize state ---
  const [participants, setParticipants] = useState([]);
  const [placements, setPlacements] = useState({});
  const [bonusMap, setBonusMap] = useState({ first: 50, second: 25, third: 10 });
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Reset form
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      format: 'playoffs',
      tournament_type: 'team',
      registration_type: 'open',
      min_elo: 0,
      max_elo: 3000,
      start_date: '',
      end_date: '',
      status: 'registration',
    });
    setError(null);
    setParticipants([]);
    setPlacements({});
  };

  // Load participants when editing a tournament
  const loadParticipants = async (tournamentId, type) => {
    setLoadingParticipants(true);
    try {
      let entries = [];
      if (type === 'team') {
        const { data, error } = await supabase
          .from('tournament_teams')
          .select('team_id, placement, teams:team_id(id, name, tag)')
          .eq('tournament_id', tournamentId);
        if (error) throw error;
        entries = data || [];
      } else {
        const { data, error } = await supabase
          .from('tournament_players')
          .select('player_id, placement, profiles:player_id(id, display_name, handle)')
          .eq('tournament_id', tournamentId);
        if (error) throw error;
        entries = data || [];
      }
      setParticipants(entries);
      // Pre‑fill placements from existing data
      const map = {};
      entries.forEach(e => {
        const id = e.team_id || e.player_id;
        if (e.placement) map[id] = e.placement;
      });
      setPlacements(map);
    } catch (err) {
      alert('Failed to load participants: ' + err.message);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createTournament.mutateAsync(form);
      resetForm();
      setCreating(false);
      alert('Tournament created successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create tournament');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await updateTournament.mutateAsync({ id: editingId, ...form });
      // Reload participants (in case tournament type changed)
      const currentTournament = tournaments.find(t => t.id === editingId);
      if (currentTournament) {
        await loadParticipants(editingId, currentTournament.tournament_type);
      }
      alert('Tournament updated successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update tournament');
    }
  };

  const handleEdit = (tournament) => {
    setEditingId(tournament.id);
    setForm({
      title: tournament.title || '',
      description: tournament.description || '',
      format: tournament.format || 'playoffs',
      tournament_type: tournament.tournament_type || 'team',
      registration_type: tournament.registration_type || 'open',
      min_elo: tournament.min_elo || 0,
      max_elo: tournament.max_elo || 3000,
      start_date: tournament.start_date || '',
      end_date: tournament.end_date || '',
      status: tournament.status || 'registration',
    });
    setCreating(false);
    // Load participants for the awards section
    loadParticipants(tournament.id, tournament.tournament_type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // ─── Finalize Tournament ──────────────────────────────────────
  const handleFinalize = async () => {
    if (!editingId) return;
    const tournament = tournaments.find(t => t.id === editingId);
    if (!tournament) return;
    if (tournament.status === 'closed') {
      alert('This tournament is already closed.');
      return;
    }

    // Build placements array (only top 3 get bonuses)
    const placementList = Object.entries(placements)
      .map(([id, placement]) => ({ id, placement: parseInt(placement) }))
      .filter(p => p.placement > 0 && p.placement <= 3)
      .sort((a, b) => a.placement - b.placement);

    if (placementList.length === 0) {
      alert('Please assign at least 1st, 2nd, and 3rd place before closing.');
      return;
    }

    // Confirm
    if (!window.confirm('Close this tournament and award ELO bonuses to top 3 participants?')) return;

    setFinalizing(true);
    try {
      // The closeTournament mutation expects placements as array of { teamId, placement }
      // For player tournaments, we need to map differently.
      // We'll use the same mutation but pass the correct IDs.
      // The mutation currently updates tournament_teams and calls award_tournament_bonus_elo.
      // For players, we need to update tournament_players and call a player bonus function.
      // Since we have both, we'll handle it conditionally.
      if (tournament.tournament_type === 'team') {
        const teamPlacements = placementList.map(p => ({ teamId: p.id, placement: p.placement }));
        await closeTournament.mutateAsync({
          id: editingId,
          placements: teamPlacements,
          bonusMap: bonusMap,
        });
      } else {
        // Player tournament: update tournament_players and award player bonuses
        // We'll call a separate function or RPC. Here we do it manually.
        for (const p of placementList) {
          await supabase
            .from('tournament_players')
            .update({ placement: p.placement })
            .eq('tournament_id', editingId)
            .eq('player_id', p.id);
          const bonusAmount =
            p.placement === 1 ? bonusMap.first :
            p.placement === 2 ? bonusMap.second :
            p.placement === 3 ? bonusMap.third : 0;
          if (bonusAmount > 0) {
            // Call the player bonus RPC (you'll need to create it)
            // If you don't have it, you can manually update the ratings table.
            // For now, we'll call a generic function that updates ratings directly.
            await supabase.rpc('award_player_bonus_elo', {
              p_player_id: p.id,
              p_bonus_elo: bonusAmount,
              p_reason: `Tournament Standing Finish Rank: #${p.placement}`,
            });
          }
        }
        // Update tournament status
        await supabase
          .from('tournaments')
          .update({ status: 'closed' })
          .eq('id', editingId);
        // Invalidate queries
        closeTournament.onSuccess && closeTournament.onSuccess({}, { id: editingId });
      }

      alert('Tournament closed successfully! ELO bonuses awarded.');
      // Refresh the list (we can just re-fetch by invalidating, but we'll reload the page for simplicity)
      window.location.reload();
    } catch (err) {
      alert('Failed to close tournament: ' + err.message);
    } finally {
      setFinalizing(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="rtr-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">
          <i className="fas fa-trophy mr-2 text-indigo-300"></i>
          Tournament Manager
        </h3>
        <RatingBadge value={rating} />
      </div>

      {/* List of existing tournaments */}
      {tournaments.length === 0 ? (
        <p className="text-sm text-gray-400">You haven't created any tournaments yet.</p>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
              <div className="flex-grow">
                <span className="text-white font-medium">{t.title}</span>
                <span className="text-gray-500 text-sm ml-2">
                  {t.format?.replace('_', ' ')} · {t.tournament_type}
                </span>
                <div className="text-xs text-gray-500">
                  {t.start_date} – {t.end_date} · Status: {t.status}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(t)}
                  className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500"
                >
                  Edit
                </button>
                {t.status === 'closed' && (
                  <span className="text-xs text-gray-500 px-2 py-1">Closed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

      {/* Create or Edit Form */}
      {(creating || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3"
        >
          <h4 className="text-white font-medium">
            {editingId ? 'Edit Tournament' : 'Create New Tournament'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              required
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
            >
              <option value="playoffs">Playoffs</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
            </select>
            <select
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.tournament_type}
              onChange={(e) => setForm({ ...form, tournament_type: e.target.value })}
            >
              <option value="team">Team (5v5)</option>
              <option value="player">Player (1v1)</option>
            </select>
            <select
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.registration_type}
              onChange={(e) => setForm({ ...form, registration_type: e.target.value })}
            >
              <option value="open">Open Registration</option>
              <option value="invitational">Invitational</option>
            </select>
            <select
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="registration">Registration</option>
              <option value="ongoing">Ongoing</option>
              <option value="closed">Closed</option>
            </select>
            <input
              type="number"
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Min Elo"
              value={form.min_elo}
              onChange={(e) => setForm({ ...form, min_elo: parseInt(e.target.value) || 0 })}
            />
            <input
              type="number"
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Max Elo"
              value={form.max_elo}
              onChange={(e) => setForm({ ...form, max_elo: parseInt(e.target.value) || 3000 })}
            />
            <input
              type="date"
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
            <input
              type="date"
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createTournament.isPending || updateTournament.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-1.5 text-sm disabled:opacity-50"
            >
              {createTournament.isPending || updateTournament.isPending
                ? 'Saving...'
                : editingId
                ? 'Update Tournament'
                : 'Create Tournament'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditingId(null);
                resetForm();
              }}
              className="bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>

          {/* ─── Awards & Finalize Section (only when editing) ─── */}
          {editingId && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-white font-medium mb-3">🏅 Awards & Finalize</h4>
              <p className="text-xs text-gray-400 mb-4">
                Assign placements (1, 2, 3, …) to participants. Top 3 will receive ELO bonuses.
              </p>

              {loadingParticipants ? (
                <LoadingSpinner />
              ) : participants.length === 0 ? (
                <p className="text-sm text-gray-500">No participants registered yet.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-2">
                    <span>Participant</span>
                    <span>Placement</span>
                    <span>Bonus</span>
                  </div>
                  {participants.map((entry) => {
                    const id = entry.team_id || entry.player_id;
                    const name = entry.teams?.name || entry.profiles?.display_name || entry.profiles?.handle || 'Unknown';
                    const currentPlacement = placements[id] || '';
                    return (
                      <div key={id} className="grid grid-cols-3 gap-2 items-center py-1 border-b border-gray-800/50">
                        <span className="text-white text-sm truncate">{name}</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          placeholder="–"
                          className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                          value={currentPlacement}
                          onChange={(e) => setPlacements(prev => ({ ...prev, [id]: e.target.value }))}
                        />
                        <span className="text-xs text-gray-400">
                          {currentPlacement == 1 ? `+${bonusMap.first}` :
                           currentPlacement == 2 ? `+${bonusMap.second}` :
                           currentPlacement == 3 ? `+${bonusMap.third}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-4 mb-4 bg-gray-800/30 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">1st:</label>
                  <input
                    type="number"
                    className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    value={bonusMap.first}
                    onChange={(e) => setBonusMap({ ...bonusMap, first: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">2nd:</label>
                  <input
                    type="number"
                    className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    value={bonusMap.second}
                    onChange={(e) => setBonusMap({ ...bonusMap, second: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">3rd:</label>
                  <input
                    type="number"
                    className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    value={bonusMap.third}
                    onChange={(e) => setBonusMap({ ...bonusMap, third: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <button
                onClick={handleFinalize}
                disabled={finalizing || participants.length === 0}
                className={`w-full py-2 rounded-lg font-semibold text-sm ${
                  finalizing || participants.length === 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {finalizing ? 'Finalizing...' : 'Finalize Tournament & Award Bonuses'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Create button (only if not creating/editing) */}
      {!creating && !editingId && (
        <button
          onClick={() => {
            setCreating(true);
            resetForm();
          }}
          className="mt-4 text-sm rtr-btn-primary inline-flex"
        >
          <i className="fas fa-plus mr-2"></i> Create Tournament
        </button>
      )}
    </div>
  );
}