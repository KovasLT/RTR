import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminUsers, useAdminMutations } from '../../hooks/useAdmin.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { APP_CONSTANTS } from '../../app-constants';
import LoadingSpinner from '../LoadingSpinner';

const A = APP_CONSTANTS.ADMIN;

const AdminUsers = () => {
  const { data: users = [], isLoading } = useAdminUsers();
  const { setUserAdmin, removeRole } = useAdminMutations();
  const { user } = useAuth();
  const [q, setQ] = useState('');

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        (u.display_name || u.handle || u.email || '').toLowerCase().includes(q.toLowerCase()),
      ),
    [users, q],
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <input
        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
        placeholder={A.USERS_SEARCH}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="rtr-card flex flex-wrap items-center gap-3">
            <div className="bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-user text-gray-300"></i>
              )}
            </div>

            <div className="min-w-0 flex-grow">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${u.id}`} className="text-white font-medium hover:underline">
                  {u.display_name || u.handle || 'Unknown'}
                </Link>
                {u.is_superuser && (
                  <span className="text-[10px] uppercase tracking-wide font-semibold bg-purple-900/30 border border-purple-700/50 text-purple-300 rounded px-1.5 py-0.5">
                    {A.SUPERUSER_BADGE}
                  </span>
                )}
                {u.is_admin && !u.is_superuser && (
                  <span className="text-[10px] uppercase tracking-wide font-semibold bg-amber-900/30 border border-amber-700/50 text-amber-300 rounded px-1.5 py-0.5">
                    {A.COL_ADMIN}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">{u.email}</div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {u.roles.length === 0 && <span className="text-xs text-gray-500">—</span>}
              {u.roles.map((role) => (
                <span key={role} className="text-[11px] bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-0.5 flex items-center gap-1">
                  <i className={`fas ${APP_CONSTANTS.ROLE_ICONS[role]} text-indigo-300`}></i>
                  {APP_CONSTANTS.ROLES[role]}
                  <button
                    title={A.REMOVE_ROLE}
                    onClick={() => removeRole.mutate({ userId: u.id, role })}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
            </div>

            {/* Only the super user can grant/revoke admin. Plain admins see
                the badges above but no admin toggle. */}
            {user?.isSuperuser && !u.is_superuser && (
              <button
                onClick={() => setUserAdmin.mutate({ userId: u.id, isAdmin: !u.is_admin })}
                className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors ${
                  u.is_admin
                    ? 'bg-amber-900/30 border border-amber-700/50 text-amber-300 hover:bg-amber-900/50'
                    : 'bg-gray-800 border border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {u.is_admin ? A.REVOKE_ADMIN : A.MAKE_ADMIN}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
