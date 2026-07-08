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
  const [managingId, setManagingId] = useState(null);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [placements, setPlacements] = useState({});
  const [bonusMap, setBonusMap] = useState({ first: 50, second: 25, third: 10 });
  const [loadingManage, setLoadingManage] = useState(false);
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
      setEditingId(null);
      resetForm();
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
  };

  // ─── Manage Tournament ──────────────────────────────────────
  const openManage = async (tournament) => {
    setManagingId(tournament.id);
    setLoadingManage(true);
    try {
      // Fetch registered teams
      const { data: entries, error } = await supabase
        .from('tournament_teams')
        .select(`
          team_id,
          placement,
          teams:team_id(id, name, tag)
        `)
        .eq('tournament_id', tournament.id);
      if (error) throw error;
      setRegisteredTeams(entries || []);
      // Pre-fill placements
      const placementMap = {};
      entries.forEach(e => {
        if (e.placement) placementMap[e.team_id] = e.placement;
      });
      setPlacements(placementMap);
    } catch (err) {
      alert('Failed to load teams: ' + err.message);
    } finally {
      setLoadingManage(false);
    }
  };

  const handlePlacementChange = (teamId, value) => {
    setPlacements(prev => ({ ...prev, [teamId]: value }));
  };

  const handleCloseTournament = async () => {
    if (!managingId) return;
    const tournament = tournaments.find(t => t.id === managingId);
    if (!tournament) return;
    if (tournament.status === 'closed') {
      alert('This tournament is already closed.');
      return;
    }

    // Build placements array (only top 3 get bonuses)
    const placementList = Object.entries(placements)
      .map(([teamId, placement]) => ({ teamId, placement: parseInt(placement) }))
      .filter(p => p.placement > 0 && p.placement <= 3)
      .sort((a, b) => a.placement - b.placement);

    if (placementList.length === 0) {
      alert('Please assign at least 1st, 2nd, and 3rd place before closing.');
      return;
    }

    if (!window.confirm('Close this tournament and award ELO bonuses to top 3 teams?')) return;

    setLoadingManage(true);
    try {
      await closeTournament.mutateAsync({
        id: managingId,
        placements: placementList,
        bonusMap: bonusMap,
      });
      alert('Tournament closed successfully! ELO bonuses awarded.');
      setManagingId(null);
      // Refresh the list (already invalidated by hook)
    } catch (err) {
      alert('Failed to close tournament: ' + err.message);
    } finally {
      setLoadingManage(false);
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
                {t.status !== 'closed' && (
                  <button
                    onClick={() => openManage(t)}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1"
                  >
                    Manage
                  </button>
                )}
                {t.status === 'closed' && (
                  <span className="text-xs text-gray-500 px-2 py-1">Closed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

      {/* Create / Edit Form (unchanged) */}
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
        </form>
      )}

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

      {/* ─── Manage Tournament Modal ────────────────────────── */}
      {managingId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Manage Tournament</h3>
              <button
                onClick={() => setManagingId(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {loadingManage ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">
                    Assign placements (1, 2, 3, ...) to the top teams. Only top 3 will receive ELO bonuses.
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-2">
                    <span>Team</span>
                    <span>Placement</span>
                    <span>Bonus</span>
                  </div>
                  {registeredTeams.length === 0 ? (
                    <p className="text-gray-500 text-sm">No teams registered yet.</p>
                  ) : (
                    registeredTeams.map((entry) => {
                      const team = entry.teams;
                      const currentPlacement = placements[entry.team_id] || '';
                      return (
                        <div key={entry.team_id} className="grid grid-cols-3 gap-2 items-center py-1 border-b border-gray-800/50">
                          <span className="text-white text-sm truncate">{team.name} {team.tag ? `[${team.tag}]` : ''}</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="–"
                            className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                            value={currentPlacement}
                            onChange={(e) => handlePlacementChange(entry.team_id, e.target.value)}
                          />
                          <span className="text-xs text-gray-400">
                            {currentPlacement == 1 ? `+${bonusMap.first}` :
                             currentPlacement == 2 ? `+${bonusMap.second}` :
                             currentPlacement == 3 ? `+${bonusMap.third}` : '—'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mb-6 bg-gray-800/30 p-3 rounded-lg border border-gray-700">
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
                  onClick={handleCloseTournament}
                  disabled={closeTournament.isPending}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {closeTournament.isPending ? 'Closing...' : 'Close Tournament & Award Bonuses'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}