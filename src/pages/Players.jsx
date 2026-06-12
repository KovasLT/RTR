import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerRankings } from '../hooks/useRankings';
import { useLanes, useRanks, useRegions } from '../hooks/useReferenceData';
import LoadingSpinner from '../components/LoadingSpinner';

const ALL = 'ALL';

const selectClass =
  'bg-[#13192b] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50';

const Players = () => {
  const { data: players = [], isLoading, error } = usePlayerRankings();
  const { data: lanes = [] } = useLanes();
  const { data: ranks = [] } = useRanks();
  const { data: regions = [] } = useRegions();

  const [q, setQ] = useState('');
  const [lane, setLane] = useState(ALL);
  const [rank, setRank] = useState(ALL);
  const [region, setRegion] = useState(ALL);

  const filtered = useMemo(() => {
    return players.filter(p => {
      if (lane !== ALL && p.lane !== lane) return false;
      if (rank !== ALL && p.rank !== rank) return false;
      if (region !== ALL && p.regionCode !== region) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [players, lane, rank, region, q]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-400">Error loading data: {error.message}</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Players Ranking</h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className={`${selectClass} flex-grow min-w-[10rem] placeholder-slate-500`}
          placeholder="Search by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className={selectClass} value={lane} onChange={(e) => setLane(e.target.value)}>
          <option value={ALL}>Lane: All</option>
          {lanes.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
        </select>
        <select className={selectClass} value={rank} onChange={(e) => setRank(e.target.value)}>
          <option value={ALL}>Rank: All</option>
          {ranks.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <select className={selectClass} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value={ALL}>Region: All</option>
          {regions.map(r => <option key={r.id} value={r.code}>{r.code}</option>)}
        </select>
      </div>

      <div className="bg-[#13192b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">RANK</th>
                <th className="px-6 py-4">PLAYER</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4">CURRENT TEAM</th>
                <th className="px-6 py-4">RATING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((player, index) => (
                <tr key={player.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-6 py-4 font-bold text-slate-400 font-mono">{index + 1}</td>
                  <td className="px-6 py-4">
                    <Link to={`/profile/${player.id}`} className="flex items-center space-x-2.5 group">
                      {player.country ? (
                        <img
                          src={`https://flagcdn.com/${player.country.toLowerCase()}.svg`}
                          width="20"
                          className="rounded-[2px] shadow-sm"
                          alt={player.country}
                        />
                      ) : (
                        <span className="text-[14px] w-5 text-center">🌍</span>
                      )}
                      <span className="font-bold text-white tracking-wide group-hover:text-indigo-300">{player.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{player.lane || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-semibold">
                    {player.team ? <Link to={`/team/${player.teamId}`} className="hover:text-indigo-300">{player.team}</Link> : '—'}
                  </td>
                  <td className="px-6 py-4 font-mono font-black text-indigo-400">{player.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-400 mt-8">No players found.</div>
      )}
    </div>
  );
};

export default Players;