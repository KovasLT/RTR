// components/tournament-manager/DoubleEliminationBracket.jsx
import { getParticipantName } from './utils';

const MatchCard = ({
  match,
  participants,
  tournamentType,
  label,
  placeholderA,
  placeholderB,
}) => {
  // ── Empty slot: show placeholder text ─────────────────────────────
  if (!match) {
    return (
      <div className="bg-[#1a1c23] border border-dashed border-gray-700 rounded-lg w-56 shadow-sm">
        <div className="bg-[#0f1219] border-b border-gray-800 px-2 py-1 rounded-t-lg flex justify-between items-center">
          <span className="text-[10px] text-indigo-300 font-bold tracking-wider">
            Match {label}
          </span>
          <span className="text-[10px] text-gray-600 italic">TBD</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="text-xs text-gray-500 italic py-0.5 truncate">
            {placeholderA || '—'}
          </div>
          <div className="text-xs text-gray-500 italic py-0.5 truncate">
            {placeholderB || '—'}
          </div>
        </div>
      </div>
    );
  }

  // ── Populated slot ────────────────────────────────────────────────
  const p1 = getParticipantName(match.team_a_id, participants, tournamentType);
  const p2 = getParticipantName(match.team_b_id, participants, tournamentType);
  const s1 = match.score_team_a;
  const s2 = match.score_team_b;
  const winner1 = s1 > s2;
  const winner2 = s2 > s1;

  return (
    <div className="bg-[#1a1c23] border border-gray-700 rounded-lg w-56 shadow-md">
      <div className="bg-[#0f1219] border-b border-gray-800 px-2 py-1 rounded-t-lg flex justify-between items-center">
        <span className="text-[10px] text-indigo-300 font-bold tracking-wider">
          Match {label}
        </span>
        <span className="text-[10px] text-gray-500 italic">Final</span>
      </div>
      <div className="p-2 space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className={`truncate flex-1 ${winner1 ? 'text-white font-bold' : 'text-gray-400'}`}>
            {p1}
          </span>
          <span className={`font-mono ml-2 ${winner1 ? 'text-green-400' : 'text-gray-500'}`}>
            {s1}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className={`truncate flex-1 ${winner2 ? 'text-white font-bold' : 'text-gray-400'}`}>
            {p2}
          </span>
          <span className={`font-mono ml-2 ${winner2 ? 'text-green-400' : 'text-gray-500'}`}>
            {s2}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Section renderer ──────────────────────────────────────────────
const BracketColumn = ({ round, reportedMatches, participants, tournamentType }) => (
  <div className="flex flex-col justify-around gap-4">
    <h5 className="text-[10px] font-bold text-gray-400 uppercase text-center mb-2 tracking-widest">
      {round.roundName}
    </h5>
    {round.slots.map((slot, sIdx) => {
      const match = reportedMatches.find((m) => m.id === slot.matchId);
      return (
        <MatchCard
          key={`${round.roundName}-${sIdx}`}
          match={match}
          participants={participants}
          tournamentType={tournamentType}
          label={slot.label}
          placeholderA={slot.placeholderA}
          placeholderB={slot.placeholderB}
        />
      );
    })}
  </div>
);

export default function DoubleEliminationBracket({
  bracketState,
  reportedMatches,
  participants,
  tournamentType,
}) {
  return (
    <div className="overflow-x-auto py-6">
      <div className="flex flex-row gap-8 min-w-max">
        {/* ── Upper Bracket ── */}
        <div className="flex flex-col gap-6">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-indigo-500/30 pb-1">
            Upper Bracket
          </h4>
          <div className="flex flex-row gap-8">
            {bracketState.upper.map((round) => (
              <BracketColumn
                key={round.roundName}
                round={round}
                reportedMatches={reportedMatches}
                participants={participants}
                tournamentType={tournamentType}
              />
            ))}
          </div>
        </div>

        {/* ── Lower Bracket ── */}
        <div className="flex flex-col gap-6 border-l-2 border-gray-800 pl-8">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-amber-500/30 pb-1">
            Lower Bracket
          </h4>
          <div className="flex flex-row gap-8">
            {bracketState.lower.map((round) => (
              <BracketColumn
                key={round.roundName}
                round={round}
                reportedMatches={reportedMatches}
                participants={participants}
                tournamentType={tournamentType}
              />
            ))}
          </div>
        </div>

        {/* ── Grand Finals ── */}
        <div className="flex flex-col gap-6 border-l-2 border-gray-800 pl-8">
          <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest border-b border-green-500/30 pb-1">
            Grand Finals
          </h4>
          <div className="flex flex-col justify-center">
            {bracketState.grand.map((round) => (
              <BracketColumn
                key={round.roundName}
                round={round}
                reportedMatches={reportedMatches}
                participants={participants}
                tournamentType={tournamentType}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}