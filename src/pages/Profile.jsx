import { useAuth } from '../hooks/useAuth.jsx';
import { Navigate } from 'react-router-dom';

/**
 * Profile Page Component
 *
 * Protected page that shows user information.
 * Redirects to login if user is not authenticated.
 *
 * @returns {JSX.Element} Profile page or redirect
 */
const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Profile
        </h1>
        <p className="text-gray-400">
          Manage your RTR account settings
        </p>
      </div>

      {/* User Information Card */}
      <div className="rtr-card">
        <div className="flex items-start gap-4">

          {/* Avatar */}
          <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<i class="fas fa-user text-2xl text-gray-300"></i>';
                }}
              />
            ) : (
              <i className="fas fa-user text-2xl text-gray-300"></i>
            )}
          </div>

          {/* User Details */}
          <div className="flex-grow">
            <h2 className="text-xl font-bold text-white mb-1">
              {user?.username}
            </h2>
            <p className="text-gray-400 mb-3">
              {user?.email}
            </p>

            {user?.provider === 'discord' && (
              <div className="flex items-center gap-2 mb-2">
                <i className="fab fa-discord text-[#5865f2]"></i>
                <span className="text-sm text-gray-400">
                  Connected via Discord
                </span>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Member since {new Date(user?.createdAt).toLocaleDateString()}
            </div>
          </div>

        </div>
      </div>

      {/* Account Actions */}
      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-4">
          Account Actions
        </h3>

        <div className="space-y-3">

          {/* Change Password (Mock) */}
          <button className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <i className="fas fa-key text-gray-400"></i>
              <div>
                <div className="text-white font-medium">Change Password</div>
                <div className="text-sm text-gray-400">Update your account password</div>
              </div>
            </div>
          </button>

          {/* Update Email (Mock) */}
          <button className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <i className="fas fa-envelope text-gray-400"></i>
              <div>
                <div className="text-white font-medium">Update Email</div>
                <div className="text-sm text-gray-400">Change your email address</div>
              </div>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full text-left p-3 rounded-lg bg-red-900/20 hover:bg-red-900/30 transition-colors border border-red-800/50"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-sign-out-alt text-red-400"></i>
              <div>
                <div className="text-red-400 font-medium">Sign Out</div>
                <div className="text-sm text-red-500/70">Sign out of your account</div>
              </div>
            </div>
          </button>

        </div>
      </div>

      {/* Stats Card (Mock) */}
      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Stats
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-300 mb-1">0</div>
            <div className="text-sm text-gray-500">Teams Followed</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-300 mb-1">0</div>
            <div className="text-sm text-gray-500">Predictions Made</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-300 mb-1">New</div>
            <div className="text-sm text-gray-500">Member Status</div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Profile;