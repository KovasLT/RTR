import { useParams } from 'react-router-dom';
import { useProfile, useRatingHistory } from '../hooks/useProfiles.js';
import LoadingSpinner from '../components/LoadingSpinner';
import PlayerPanel from '../components/PlayerPanel';

export default function PlayerPage() {
  const { id } = useParams();
  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const { data: ratingHistory = [] } = useRatingHistory('player', id);

  if (profileLoading) return <LoadingSpinner />;
  if (!profile) return <div className="text-center text-red-400 py-16">Player not found</div>;

  // Find the player's current rating (from profile.ratings or ratingHistory)
  const rating = profile.ratings?.find(r => r.subject_type === 'player')?.rating
                || (ratingHistory.length ? ratingHistory[ratingHistory.length - 1].new_rating : 1200);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PlayerPanel profile={profile} rating={rating} userId={id} />
    </div>
  );
}