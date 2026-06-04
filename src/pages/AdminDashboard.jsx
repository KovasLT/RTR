import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminRatings from '../components/admin/AdminRatings';
import AdminReference from '../components/admin/AdminReference';

const A = APP_CONSTANTS.ADMIN;

const TABS = [
  { key: 'overview', label: A.TAB_OVERVIEW, Component: AdminOverview },
  { key: 'users', label: A.TAB_USERS, Component: AdminUsers },
  { key: 'ratings', label: A.TAB_RATINGS, Component: AdminRatings },
  { key: 'reference', label: A.TAB_REFERENCE, Component: AdminReference },
];

/**
 * Admin dashboard. Client gate is `is_admin`; the database (RLS + SECURITY
 * DEFINER functions) independently enforces admin-only writes.
 */
const AdminDashboard = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState('overview');

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) {
    return <div className="text-center text-gray-400 py-16">{A.NOT_AUTHORIZED}</div>;
  }

  const Active = TABS.find((t) => t.key === tab).Component;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{A.TITLE}</h1>
        <p className="text-gray-400">{A.SUBTITLE}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === t.key
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
};

export default AdminDashboard;
