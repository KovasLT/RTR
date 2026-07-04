import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyTeams, useTeamMutations } from '../hooks/useTeams.js';
import { APP_CONSTANTS } from '../app-constants';
import RatingBadge from './RatingBadge';

const D = APP_CONSTANTS.DASHBOARD;

export default function TeamManagerPanel({ rating, userId }) {
  const navigate = useNavigate();
  const { data: teams = [] } = useMyTeams(userId);
  const { createTeam } = useTeamMutations();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', tag: '' });
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const team = await createTeam.mutateAsync({ managerId: userId, name: form.name, tag: form.tag });
      navigate(`/team/${team.id}`);
    } catch (err) {
      console.error("Database submission failed:", err);
      setError(err?.message || APP_CONSTANTS.TEAM_MGMT.ERROR || "An unexpected error occurred while creating the team.");
    }
  };

  return (
    <div className="rtr-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">
          <i className={`fas ${APP_CONSTANTS.ROLE_ICONS.team_manager} mr-2 text-indigo-300`}></i>
          {D.TEAM_MANAGER_TITLE}
        </h3>
        <RatingBadge value={rating} />
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-gray-400">{D.TEAM_MANAGER_EMPTY}</p>
      ) : (
        <div className="space-y-2">
          {teams.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
              <div className="flex-grow">
                <span className="text-white font-medium">{t.name}</span>
                {t.tag && <span className="text-gray-500 text-sm ml-2">[{t.tag}]</span>}
                <div className="text-xs text-gray-500">
                  {t.memberCount} {D.TEAM_MEMBERS_COUNT}
                  {t.pendingCount > 0 && (
                    <span className="ml-2 text-amber-300">· {t.pendingCount} {D.TEAM_PENDING_APPS}</span>
                  )}
                </div>
              </div>
              <RatingBadge value={t.rating} />
              <Link to={`/team/${t.id}`} className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500">
                {D.TEAM_MANAGE}
              </Link>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

      {creating ? (
        <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
          <input
            autoFocus
            required
            className="flex-grow bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            placeholder={APP_CONSTANTS.TEAM_MGMT.NAME_LABEL}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="w-24 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            placeholder={APP_CONSTANTS.TEAM_MGMT.TAG_LABEL}
            value={form.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
          />
          <button type="submit" disabled={createTeam.isPending} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 disabled:opacity-50">
            {createTeam.isPending ? APP_CONSTANTS.TEAM_MGMT.CREATING : APP_CONSTANTS.TEAM_MGMT.CREATE}
          </button>
        </form>
      ) : (
        <button onClick={() => setCreating(true)} className="mt-4 text-sm rtr-btn-primary inline-flex">
          <i className="fas fa-plus mr-2"></i>{D.TEAM_MANAGER_CREATE}
        </button>
      )}
    </div>
  );
}