import { getParticipantName } from './utils';

const MatchCard = ({ match, participants, tournamentType }) => {
  const p1Name = getParticipantName(match?.team_a_id, participants, tournamentType);
  const p2Name = getParticipantName(match?.team_b_id, participants, tournamentType);
  const score1 = match?.score_team_a ?? '-';
  const score2 = match?.score_team_b ?? '-';

  return (
    <div className="bg-[#1a1c23] border border-gray-700 rounded-lg p-2 w-48 shadow-md">
      <div className="flex justify-between items-center text-xs">
        <span className={`truncate ${score1 > score2 ? 'text-white font-bold' : 'text-gray-300'}`}>
          {p1Name || '---'}
        </span>
        <span className="font-mono text-gray-400">{score1}</span>
      </div>
      <div className="flex justify-between items-center text-xs mt-1">
        <span className={`truncate ${score2 > score1 ? 'text-white font-bold' : 'text-gray-300'}`}>
          {p2Name || '---'}
        </span>
        <span className="font-mono text-gray-400">{score2}</span>
      </div>
    </div>
  );
};

export default function BracketRenderer({ format, matches, participants, tournamentType }) {
  if (!matches.length) {
    return <div className="text-center text-gray-500 py-8">No matches available for bracket view.</div>;
  }

  // Try to group by round if the 'round' column exists and has values
  const hasRounds = matches.some(m => m.round !== undefined && m.round !== null);
  if (hasRounds) {
    const matchesByRound = matches.reduce((acc, m) => {
      const round = m.round || 1;
      if (!acc[round]) acc[round] = [];
      acc[round].push(m);
      return acc;
    }, {});
    const rounds = Object.keys(matchesByRound).sort((a, b) => a - b);

    return (
      <div className="overflow-x-auto py-4">
        <div className="flex flex-row gap-8 justify-start items-start">
          {rounds.map(round => (
            <div key={round} className="flex flex-col gap-4">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">
                {format === 'double_elimination' ? `Round ${round}` : `Round ${round}`}
              </div>
              {matchesByRound[round].map(match => (
                <MatchCard key={match.id} match={match} participants={participants} tournamentType={tournamentType} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: simple grid layout
  return (
    <div className="overflow-x-auto py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {matches.map(match => (
          <MatchCard key={match.id} match={match} participants={participants} tournamentType={tournamentType} />
        ))}
      </div>
    </div>
  );
}