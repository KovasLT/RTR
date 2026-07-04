import { APP_CONSTANTS } from '../app-constants';

const REASON = APP_CONSTANTS.DASHBOARD.RATING_REASONS;

export default function ActivityCard({ events }) {
  const recent = [...events].reverse().slice(0, 8);
  return (
    <div className="rtr-card">
      <h3 className="text-lg font-semibold text-white mb-2">{APP_CONSTANTS.DASHBOARD.PLAYER_ACTIVITY_TITLE}</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400">{APP_CONSTANTS.DASHBOARD.PLAYER_ACTIVITY_EMPTY}</p>
      ) : (
        <div className="space-y-2">
          {recent.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-sm border-b border-gray-800 pb-2 last:border-0">
              <span className={`font-mono font-bold w-12 shrink-0 ${e.delta > 0 ? 'text-green-400' : e.delta < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                {e.delta > 0 ? `+${e.delta}` : e.delta}
              </span>
              <span className="text-gray-300 flex-grow">{REASON[e.reason] || e.reason}</span>
              <span className="text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}