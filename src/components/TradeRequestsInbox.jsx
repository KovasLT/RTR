import { Link } from 'react-router-dom';
import { APP_CONSTANTS } from '../app-constants';

const TR = APP_CONSTANTS.TRADES;
const personName = (p) => p?.display_name || p?.handle || 'Unknown';

const TradeRequestsInbox = ({
  requests,
  isManager,
  currentTeamId,
  onRespond,
  onCancel,
  busyId,
}) => {
  if (!requests?.length) {
    return <p className="text-xs text-gray-400">{TR.EMPTY}</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((r) => {
        const incoming = r.to_team_id === currentTeamId;
        const canAct = isManager && incoming && r.status === 'pending';
        const canCancel = isManager && !incoming && r.status === 'pending';

        return (
          <div
            key={r.id}
            className="border border-gray-800 rounded-lg p-2 bg-gray-800/30"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-gray-500">
                  {incoming ? 'Incoming' : 'Outgoing'} ·{' '}
                  {TR.STATUS[r.status] || r.status}
                </div>
                <div className="text-white truncate">
                  <Link
                    to={`/profile/${r.player_id}`}
                    className="hover:text-indigo-300"
                  >
                    {personName(r.player)}
                  </Link>
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {r.from_team?.name} → {r.to_team?.name}
                </div>
                {r.message && (
                  <div className="text-[10px] text-gray-500 italic mt-0.5">
                    "{r.message}"
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 items-end">
                {canAct && (
                  <>
                    <button
                      onClick={() => onRespond(r, true)}
                      disabled={busyId === r.id}
                      className="text-[10px] bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 rounded disabled:opacity-50"
                    >
                      {TR.ACCEPT}
                    </button>
                    <button
                      onClick={() => onRespond(r, false)}
                      disabled={busyId === r.id}
                      className="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded disabled:opacity-50"
                    >
                      {TR.REJECT}
                    </button>
                  </>
                )}
                {canCancel && (
                  <button
                    onClick={() => onCancel(r)}
                    disabled={busyId === r.id}
                    className="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded disabled:opacity-50"
                  >
                    {TR.CANCEL}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TradeRequestsInbox;