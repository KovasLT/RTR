import PlayerPanel from './PlayerPanel';
import TeamManagerPanel from './TeamManagerPanel';
import ScoutPanel from './ScoutPanel';
import CoachPanel from './CoachPanel';
import TournamentManagerPanel from './TournamentManagerPanel';

export default function RolePanel({ role, profile, userId }) {
  const rating = profile?.ratings?.find((r) => r.subject_type === role)?.rating;

  if (role === 'player') return <PlayerPanel profile={profile} rating={rating} userId={userId} />;
  if (role === 'team_manager') return <TeamManagerPanel rating={rating} userId={userId} />;
  if (role === 'scout') return <ScoutPanel rating={rating} userId={userId} />;
  if (role === 'coach') return <CoachPanel profile={profile} rating={rating} userId={userId} />;
  if (role === 'tournament_manager') return <TournamentManagerPanel rating={rating} userId={userId} />;

  return null;
}