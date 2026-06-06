import { Link } from 'react-router-dom';
import { usePlayerRankings } from '../hooks/useRankings';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONSTANTS } from '../app-constants';

const Players = () => {
  const { data: players = [], isLoading, error } = usePlayerRankings();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-400">{APP_CONSTANTS.UI.ERROR_LOADING_DATA} {error.message}</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">{APP_CONSTANTS.PLAYERS.PAGE_TITLE}</h2>

      <div className="bg-[#13192b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">{APP_CONSTANTS.PLAYERS.TABLE_HEADERS.RANK}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.PLAYERS.TABLE_HEADERS.PLAYER}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.PLAYERS.TABLE_HEADERS.ROLE}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.PLAYERS.TABLE_HEADERS.CURRENT_TEAM}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.PLAYERS.TABLE_HEADERS.RATING}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {players.map((player, index) => {
                const flagCode = player.country ? player.country.toLowerCase() : 'un';

                return (
                  <tr key={player.id} className="rtr-table-row hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-bold text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link to={`/profile/${player.id}`} className="flex items-center space-x-2.5 group">
                        <img
                          src={`https://flagcdn.com/${flagCode}.svg`}
                          width="20"
                          className="rounded-[2px] shadow-sm"
                          alt={player.country || 'flag'}
                        />
                        <span className="font-bold text-white tracking-wide group-hover:text-indigo-300">{player.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{player.lane || '—'}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{player.team || '—'}</td>
                    <td className="px-6 py-4 font-mono font-black text-indigo-400">{player.rating}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {players.length === 0 && (
        <div className="text-center text-slate-400 mt-8">
          {APP_CONSTANTS.PLAYERS.EMPTY_STATE}
        </div>
      )}
    </div>
  );
};

export default Players;
