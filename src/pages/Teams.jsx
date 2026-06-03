import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONSTANTS } from '../app-constants';

const Teams = () => {
  const { teams, stats, isLoading, error } = useData();
  const [currentRegionFilter, setCurrentRegionFilter] = useState('ALL');

  const availableRegions = stats.availableRegions || ['ALL', 'WEU', 'EEU', 'MENA'];

  const filteredTeams = useMemo(() => {
    if (currentRegionFilter === 'ALL') return teams;
    return teams.filter(team => team.region === currentRegionFilter);
  }, [teams, currentRegionFilter]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-400">{APP_CONSTANTS.UI.ERROR_LOADING_DATA} {error}</div>;

  const getStatusMarkerStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 animate-pulse';
      case 'inactive': return 'bg-amber-500';
      default: return 'bg-rose-500';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{APP_CONSTANTS.TEAMS.PAGE_TITLE}</h2>
        <div className="flex bg-[#13192b] border border-slate-800 p-1 rounded-lg">
          {availableRegions.map(regionKey => {
            const isCurrent = currentRegionFilter === regionKey;
            const stateClasses = isCurrent
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';

            return (
              <button
                key={regionKey}
                onClick={() => setCurrentRegionFilter(regionKey)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${stateClasses}`}
              >
                {regionKey}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[#13192b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.RANK}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.TEAM}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.REGION}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.RATING}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.RECORD}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.WIN_RATE}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.STATUS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTeams.map((team, index) => {
                const flagCode = team.flag ? team.flag.toLowerCase() : 'un';
                const statusMarkerStyle = getStatusMarkerStyle(team.status);

                return (
                  <tr key={team.name + team.region} className="rtr-table-row hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-bold text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={`https://flagcdn.com/${flagCode}.svg`}
                          width="20"
                          className="rounded-[2px] shadow-sm"
                          alt={`${team.flag} flag`}
                          title={team.countryName || team.flag}
                        />
                        <span className="text-white font-bold tracking-wide">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">
                        {team.region}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-indigo-400">{team.rating}</td>
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">{team.wins}W - {team.losses}L</td>
                    <td className="px-6 py-4 font-mono text-slate-300 text-xs">{team.winRate}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${statusMarkerStyle} inline-block`}></span>
                        <span className="font-medium text-[11px] text-slate-400">{team.lastActive}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center text-slate-400 mt-8">
          {APP_CONSTANTS.TEAMS.EMPTY_STATE}
        </div>
      )}
    </div>
  );
};

export default Teams;