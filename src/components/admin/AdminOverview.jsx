import { useAdminStats } from '../../hooks/useAdmin.js';
import { APP_CONSTANTS } from '../../app-constants';
import LoadingSpinner from '../LoadingSpinner';

const A = APP_CONSTANTS.ADMIN;

const StatCard = ({ label, value }) => (
  <div className="rtr-card text-center">
    <div className="text-3xl font-bold text-white">{value}</div>
    <div className="text-sm text-gray-400 mt-1">{label}</div>
  </div>
);

const AdminOverview = () => {
  const { data: stats, isLoading } = useAdminStats();
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label={A.STAT_USERS} value={stats?.users ?? 0} />
      <StatCard label={A.STAT_PLAYERS} value={stats?.players ?? 0} />
      <StatCard label={A.STAT_ADMINS} value={stats?.admins ?? 0} />
      <StatCard label={A.STAT_RATINGS} value={stats?.ratings ?? 0} />
    </div>
  );
};

export default AdminOverview;
