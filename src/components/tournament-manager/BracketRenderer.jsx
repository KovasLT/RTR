import { getParticipantName } from './utils';

const MatchCard = ({ match, participants, tournamentType }) => {
  const p1 = getParticipantName(match.team_a_id, participants, tournamentType);
  const p2 = getParticipantName(match.team_b_id, participants, tournamentType);
  const score1 = match.score_team_a;
  const score2 = match.score_team_b;

  return (
    <div className="bg-[#1a1c23] border border-gray-700 rounded-lg p-2 w-48 shadow-md">
      <div className="flex justify-between text-xs">
        <span className={`truncate ${score1 > score2 ? 'text-white font-bold' : 'text-gray-300'}`}>{p1 || '---'}</span>
        <span className="font-mono text-gray-400">{score1}</span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className={`truncate ${score2 > score1 ? 'text-white font-bold' : 'text-gray-300'}`}>{p2 || '---'}</span>
        <span className="font-mono text-gray-400">{score2}</span>
      </div>
    </div>
  );
};

export default function BracketRenderer({ format, reportedMatches, participants, tournamentType }) {
  const matchesByRound = reportedMatches.reduce((acc, m) => {
    const round = m.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(m);
    return acc;
  }, {});

  const rounds = Object.keys(matchesByRound).sort((a,b) => a-b);

  if (rounds.length === 0) {
    return <div className="text-center text-gray-500 py-8">No matches to display.</div>;
  }

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex flex-row gap-8">
        {rounds.map(round => (
          <div key={round} className="flex flex-col gap-4">
            <div className="text-xs font-bold text-indigo-400 uppercase mb-2">Round {round}</div>
            {matchesByRound[round].map(m => (
              <MatchCard key={m.id} match={m} participants={participants} tournamentType={tournamentType} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}