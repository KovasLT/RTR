import { Link, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfiles.js';
import { useMyWatchlist, useScoutMutations } from '../hooks/useScouting.js';
import { useEndorsements, useEndorsementMutations } from '../hooks/useEndorsements.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

const C = APP_CONSTANTS.PROFILE_PAGE;

const ProfileView = () => {
  const { id } = useParams();
  const { user, roles, logout } = useAuth();
  const profileId = id || user?.id;
  const isOwner = Boolean(user?.id) && profileId === user?.id;

  const { data: profile, isLoading } = useProfile(profileId);
  const { data: watchlist = [] } = useMyWatchlist(user?.id);
  const { watch, unwatch } = useScoutMutations();
  const { data: endorsements = [] } = useEndorsements(profileId);
  const { endorse, unendorse } = useEndorsementMutations(profileId);

  if (!profileId) return <Navigate to="/login" replace />;
  if (isLoading) return <LoadingSpinner />;
  if (!profile) {
    return <div className="text-center text-gray-400 py-16">{C.NOT_FOUND}</div>;
  }

  const player = profile.player;
  const ratingFor = (type) => profile.ratings?.find((r) => r.subject_type === type);
  const canScout = !isOwner && roles?.includes('scout') && profile.roles.includes('player');
  const isWatching = watchlist.some((w) => w.playerId === profileId);

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
            {/* Display referrer if exists */}
            {profile.referrer && (
              <p className="text-sm text-gray-400 mt-1">
                {C.INVITED_BY} {profile.referrer.display_name}
              </p>
            )}
            {profile.bio && <p className="text-gray-300 mt-3 whitespace-pre-line">{profile.bio}</p>}
            <p className="text-xs text-gray-500 mt-3">
              {C.MEMBER_SINCE} {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* ... owner actions, scout actions etc. unchanged ... */}
        {isOwner && ( ... )}
        {canScout && ( ... )}
      </div>

      {/* Roles + ratings - unchanged */}
      {/* Player details - unchanged */}

      <p className="text-center text-xs text-gray-500">
        <i className="fab fa-discord text-[#5865f2] mr-1"></i> {C.DISCORD_NOTE}
      </p>
    </div>
  );
};

export default ProfileView;