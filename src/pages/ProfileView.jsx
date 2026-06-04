import { Link, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfiles.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

const C = APP_CONSTANTS.PROFILE_PAGE;

/**
 * Public profile view. Serves `/profile/:id` and, when no id is given,
 * `/profile` for the signed-in user. Owners see edit / sign-out actions.
 */
const ProfileView = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const profileId = id || user?.id;
  const isOwner = Boolean(user?.id) && profileId === user?.id;

  const { data: profile, isLoading } = useProfile(profileId);

  // Visiting /profile while logged out → send to login.
  if (!profileId) return <Navigate to="/login" replace />;
  if (isLoading) return <LoadingSpinner />;
  if (!profile) {
    return <div className="text-center text-gray-400 py-16">{C.NOT_FOUND}</div>;
  }

  const player = profile.player;
  const ratingFor = (type) => profile.ratings?.find((r) => r.subject_type === type);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Identity card */}
      <div className="rtr-card">
        <div className="flex items-start gap-4">
          <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-user text-2xl text-gray-300"></i>
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h1 className="text-2xl font-bold text-white">{profile.display_name || profile.handle}</h1>
            {profile.region?.name && (
              <p className="text-gray-400 text-sm">
                <i className="fas fa-globe mr-1"></i>
                {profile.region.name}
                {profile.country_iso ? ` · ${profile.country_iso}` : ''}
              </p>
            )}
            {profile.bio && <p className="text-gray-300 mt-3 whitespace-pre-line">{profile.bio}</p>}
            <p className="text-xs text-gray-500 mt-3">
              {C.MEMBER_SINCE} {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-3 mt-5 pt-5 border-t border-gray-700">
            <Link to="/profile/edit" className="rtr-btn-primary">
              <i className="fas fa-pen"></i> {C.EDIT}
            </Link>
            <button
              onClick={logout}
              className="bg-red-900/20 hover:bg-red-900/30 border border-red-800/50 text-red-400 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-sign-out-alt"></i> {C.SIGN_OUT}
            </button>
          </div>
        )}
      </div>

      {/* Roles + ratings */}
      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-4">{C.ROLES}</h3>
        {profile.roles.length === 0 ? (
          <p className="text-gray-400 text-sm">{C.NO_ROLES}</p>
        ) : (
          <div className="space-y-2">
            {profile.roles.map((role) => {
              const rating = ratingFor(role);
              return (
                <div key={role} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-4 py-3">
                  <span className="text-white font-medium">{APP_CONSTANTS.ROLES[role]}</span>
                  {rating && (
                    <span className="text-indigo-300 font-mono font-bold">{rating.rating}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Player details */}
      {player && (
        <div className="rtr-card">
          <h3 className="text-lg font-semibold text-white mb-4">{APP_CONSTANTS.ROLES.player}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">{C.LANE}</div>
              <div className="text-white">{player.lane?.name || '—'}</div>
            </div>
            <div>
              <div className="text-gray-500">{C.RANK}</div>
              <div className="text-white">{player.rank?.name || '—'}</div>
            </div>
            <div>
              <div className="text-gray-500">{C.SERVER}</div>
              <div className="text-white">{player.server || '—'}</div>
            </div>
          </div>
          {player.looking_for_team && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-800/50 rounded-lg px-3 py-1">
              <i className="fas fa-search"></i> {APP_CONSTANTS.DIRECTORY.LFT_BADGE}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        <i className="fab fa-discord text-[#5865f2] mr-1"></i> {C.DISCORD_NOTE}
      </p>
    </div>
  );
};

export default ProfileView;
