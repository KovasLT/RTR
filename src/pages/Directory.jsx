import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDirectory } from '../hooks/useProfiles.js';
import { useLanes, useRanks, useRegions } from '../hooks/useReferenceData.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

const C = APP_CONSTANTS.DIRECTORY;
const ROLE_KEYS = ['player', 'coach', 'scout', 'tournament_manager', 'team_manager'];

const selectClass =
  'bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500';

/**
 * Talent directory — browse everyone with a profile, filter by role, lane,
 * rank, region, and name.
 */
const Directory = () => {
  const { data: people = [], isLoading } = useDirectory();
  const { data: lanes = [] } = useLanes();
  const { data: ranks = [] } = useRanks();
  const { data: regions = [] } = useRegions();

  const [filters, setFilters] = useState({ q: '', role: '', lane: '', rank: '', region: '' });
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const filtered = useMemo(
    () =>
      people.filter((p) => {
        const name = (p.display_name || p.handle || '').toLowerCase();
        if (filters.q && !name.includes(filters.q.toLowerCase())) return false;
        if (filters.role && !p.roles.includes(filters.role)) return false;
        if (filters.lane && String(p.player?.lane?.id) !== filters.lane) return false;
        if (filters.rank && String(p.player?.rank?.id) !== filters.rank) return false;
        if (filters.region && String(p.region?.id) !== filters.region) return false;
        return true;
      }),
    [people, filters],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{C.TITLE}</h1>
        <p className="text-gray-400">{C.SUBTITLE}</p>
      </div>

      {/* Filters */}
      <div className="rtr-card flex flex-wrap gap-3 items-center">
        <input
          className={`${selectClass} flex-grow min-w-[12rem]`}
          placeholder={C.SEARCH_PLACEHOLDER}
          value={filters.q}
          onChange={(e) => set('q', e.target.value)}
        />
        <select className={selectClass} value={filters.role} onChange={(e) => set('role', e.target.value)}>
          <option value="">{C.FILTER_ROLE}: {C.ALL}</option>
          {ROLE_KEYS.map((r) => (
            <option key={r} value={r}>{APP_CONSTANTS.ROLES[r]}</option>
          ))}
        </select>
        <select className={selectClass} value={filters.lane} onChange={(e) => set('lane', e.target.value)}>
          <option value="">{C.FILTER_LANE}: {C.ALL}</option>
          {lanes.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select className={selectClass} value={filters.rank} onChange={(e) => set('rank', e.target.value)}>
          <option value="">{C.FILTER_RANK}: {C.ALL}</option>
          {ranks.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select className={selectClass} value={filters.region} onChange={(e) => set('region', e.target.value)}>
          <option value="">{C.FILTER_REGION}: {C.ALL}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">{C.EMPTY}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/profile/${p.id}`}
              className="rtr-card hover:border-gray-600 transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-user text-gray-300"></i>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{p.display_name || p.handle}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {p.region?.name || ''}
                    {p.player?.rank?.name ? ` · ${p.player.rank.name}` : ''}
                  </div>
                </div>
                {p.playerRating != null && (
                  <span className="ml-auto text-indigo-300 font-mono font-bold text-sm">{p.playerRating}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {p.roles.map((role) => (
                  <span key={role} className="text-[11px] bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-0.5">
                    <i className={`fas ${APP_CONSTANTS.ROLE_ICONS[role]} mr-1 text-indigo-300`}></i>
                    {APP_CONSTANTS.ROLES[role]}
                  </span>
                ))}
              </div>

              {p.player?.looking_for_team && (
                <span className="text-[11px] text-green-400 bg-green-900/20 border border-green-800/50 rounded px-2 py-0.5 self-start">
                  {C.LFT_BADGE}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Directory;
