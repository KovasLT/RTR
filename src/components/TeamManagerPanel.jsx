import { useState, useEffect } from 'react';
import { useTournaments } from '../hooks/useTournaments';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import RatingBadge from './RatingBadge';
import { APP_CONSTANTS } from '../app-constants';

const D = APP_CONSTANTS.DASHBOARD;

export default function TournamentManagerPanel({ rating, userId }) {
  const { user } = useAuth();
  const { data: tournaments, isLoading, createTournament, updateTournament } = useTournaments(userId);
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

  // Reset form when switching between create/edit
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

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
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
              <button
                onClick={() => handleEdit(t)}
                className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
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