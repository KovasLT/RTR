import { useMemo, useState } from 'react';
import { useAdminUsers, useAdminMutations, useRatingEvents } from '../../hooks/useAdmin.js';
import { APP_CONSTANTS } from '../../app-constants';

const A = APP_CONSTANTS.ADMIN;

const inputClass =
  'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500';

const AdminRatings = () => {
  const { data: users = [] } = useAdminUsers();
  const { adjustRating } = useAdminMutations();

  const [q, setQ] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');

  const matches = useMemo(
    () =>
      q
        ? users
            .filter((u) => (u.display_name || u.handle || u.email || '').toLowerCase().includes(q.toLowerCase()))
            .slice(0, 6)
        : [],
    [users, q],
  );

  const selectedUser = users.find((u) => u.id === userId);
  const { data: events = [] } = useRatingEvents(role, userId);

  const pickUser = (u) => {
    setUserId(u.id);
    setQ(u.display_name || u.handle || u.email || '');
    setRole(u.roles[0] || '');
  };

  const apply = (e) => {
    e.preventDefault();
    const d = parseInt(delta, 10);
    if (!userId || !role || Number.isNaN(d)) return;
    adjustRating.mutate(
      { subjectType: role, subjectId: userId, delta: d, note: note || null },
      {
        onSuccess: () => {
          setDelta('');
          setNote('');
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={apply} className="rtr-card space-y-4">
        {/* User search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">{A.RATINGS_PICK_USER}</label>
          <input className={inputClass} value={q} onChange={(e) => { setQ(e.target.value); setUserId(''); }} placeholder={A.RATINGS_PICK_USER} />
          {matches.length > 0 && !userId && (
            <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              {matches.map((u) => (
                <button type="button" key={u.id} onClick={() => pickUser(u)} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800">
                  {u.display_name || u.handle} <span className="text-gray-500">{u.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{A.RATINGS_SUBJECT}</label>
              <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">—</option>
                {selectedUser.roles.map((r) => (
                  <option key={r} value={r}>{APP_CONSTANTS.ROLES[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{A.RATINGS_DELTA}</label>
              <input className={inputClass} type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 25 or -10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{A.RATINGS_NOTE}</label>
              <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!userId || !role || delta === '' || adjustRating.isPending}
          className="rtr-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adjustRating.isPending ? A.SAVING : A.RATINGS_APPLY}
        </button>

        {adjustRating.isError && (
          <p className="text-sm text-red-400">{adjustRating.error?.message || A.ERROR}</p>
        )}
      </form>

      {/* Ledger for the selected subject */}
      {userId && role && (
        <div className="rtr-card">
          <h3 className="text-sm font-semibold text-white mb-3">{A.RATINGS_LEDGER}</h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">{A.RATINGS_EMPTY_LEDGER}</p>
          ) : (
            <div className="space-y-1.5">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between text-sm border-b border-gray-800 pb-1.5">
                  <span className="text-gray-400">
                    {ev.reason}
                    {ev.note ? ` · ${ev.note}` : ''}
                  </span>
                  <span className="font-mono">
                    <span className={ev.delta >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {ev.delta >= 0 ? `+${ev.delta}` : ev.delta}
                    </span>
                    <span className="text-gray-300"> → {ev.new_rating}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRatings;
