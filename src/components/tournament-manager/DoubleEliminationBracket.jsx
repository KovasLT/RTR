import { getParticipantName } from './utils';

// ─────────────────────────────────────────────────────────────────────
//  Layout constants — everything is absolutely positioned on one canvas
// ─────────────────────────────────────────────────────────────────────
const CARD_W = 200;
const CARD_H = 62;

const POS = {
  // Upper bracket
  A:  { x: 0,   y: 40  },
  B:  { x: 0,   y: 140 },
  C:  { x: 240, y: 90  },
  // Lower bracket
  D:  { x: 0,   y: 300 },
  E:  { x: 0,   y: 400 },
  F:  { x: 240, y: 350 },
  G:  { x: 480, y: 350 },
  // Grand final
  GF: { x: 720, y: 90  },
};

const CONTAINER_W = 930;
const CONTAINER_H = 480;

// ─────────────────────────────────────────────────────────────────────
//  Match card — shows placeholder text when empty
// ─────────────────────────────────────────────────────────────────────
const MatchCard = ({ match, participants, tournamentType, label, placeholderA, placeholderB }) => {
  const isEmpty = !match;
  const wA = !isEmpty && match.score_team_a > match.score_team_b;
  const wB = !isEmpty && match.score_team_b > match.score_team_a;

  return (
    <div
      className={`w-full h-full rounded-lg overflow-hidden border ${
        isEmpty
          ? 'border-dashed border-gray-700 bg-[#1a1c23]/50'
          : 'border-gray-700 bg-[#1a1c23] shadow-md'
      }`}
    >
      <div className="bg-[#0f1219] border-b border-gray-800 px-2 py-[3px] flex items-center justify-between">
        <span className="text-[10px] font-bold text-indigo-300 tracking-wider uppercase">
          {label}
        </span>
        {isEmpty && <span className="text-[10px] text-gray-600 italic">TBD</span>}
      </div>

      <div className="px-2 py-1">
        {/* Slot A */}
        <div className="flex justify-between items-center h-[22px]">
          <span
            className={`text-[11px] truncate flex-1 ${
              isEmpty
                ? 'text-gray-500 italic'
                : wA
                ? 'text-white font-bold'
                : 'text-gray-400'
            }`}
          >
            {isEmpty
              ? placeholderA
              : getParticipantName(match.team_a_id, participants, tournamentType)}
          </span>
          {!isEmpty && (
            <span
              className={`text-[11px] font-mono ml-2 ${
                wA ? 'text-green-400' : 'text-gray-500'
              }`}
            >
              {match.score_team_a}
            </span>
          )}
        </div>

        {/* Slot B */}
        <div className="flex justify-between items-center h-[22px]">
          <span
            className={`text-[11px] truncate flex-1 ${
              isEmpty
                ? 'text-gray-500 italic'
                : wB
                ? 'text-white font-bold'
                : 'text-gray-400'
            }`}
          >
            {isEmpty
              ? placeholderB
              : getParticipantName(match.team_b_id, participants, tournamentType)}
          </span>
          {!isEmpty && (
            <span
              className={`text-[11px] font-mono ml-2 ${
                wB ? 'text-green-400' : 'text-gray-500'
              }`}
            >
              {match.score_team_b}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  Small positioned wrapper — places a card at (x, y)
// ─────────────────────────────────────────────────────────────────────
const PlacedCard = ({ pos, children }) => (
  <div
    style={{
      position: 'absolute',
      left: pos.x,
      top: pos.y,
      width: CARD_W,
      height: CARD_H,
    }}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  Column header (gray box, like Liquipedia)
// ─────────────────────────────────────────────────────────────────────
const ColumnHeader = ({ x, y, children }) => (
  <div
    style={{ position: 'absolute', left: x, top: y, width: CARD_W }}
    className="bg-gray-700/80 text-gray-100 text-[11px] font-medium rounded px-3 py-1 text-center tracking-wide"
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────
export default function DoubleEliminationBracket({
  bracketState,
  reportedMatches,
  participants,
  tournamentType,
}) {
  // Helper — pick the slot meta from bracketState
  const slot = (type, r, s) => bracketState[type]?.[r]?.slots?.[s] || {};
  const match = (type, r, s) => {
    const mId = slot(type, r, s).matchId;
    return reportedMatches.find((m) => m.id === mId);
  };

  // Render a card wrapper for one slot
  const Card = ({ keyName, type, r, s }) => {
    const meta = slot(type, r, s);
    return (
      <PlacedCard pos={POS[keyName]}>
        <MatchCard
          match={match(type, r, s)}
          participants={participants}
          tournamentType={tournamentType}
          label={meta.label || keyName}
          placeholderA={meta.placeholderA}
          placeholderB={meta.placeholderB}
        />
      </PlacedCard>
    );
  };

  // SVG paths — one connector per logical link
  const strokeProps = { stroke: '#4b5563', strokeWidth: 1.5, fill: 'none' };

  return (
    <div className="overflow-x-auto py-6">
      <div
        style={{
          position: 'relative',
          width: CONTAINER_W,
          height: CONTAINER_H,
        }}
        className="mx-auto"
      >
        {/* ── Column headers ───────────────────────────────────── */}
        <ColumnHeader x={0}   y={0}>Upper Bracket Round 1</ColumnHeader>
        <ColumnHeader x={240} y={0}>Upper Bracket Final</ColumnHeader>
        <ColumnHeader x={720} y={0}>Grand Final</ColumnHeader>

        <ColumnHeader x={0}   y={260}>Lower Bracket Round 1</ColumnHeader>
        <ColumnHeader x={240} y={260}>Lower Bracket Semifinal</ColumnHeader>
        <ColumnHeader x={480} y={260}>Lower Bracket Final</ColumnHeader>

        {/* ── Connector lines ──────────────────────────────────── */}
        <svg
          width={CONTAINER_W}
          height={CONTAINER_H}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* A + B → C  (upper round 1 merge) */}
          <path d={`M ${POS.A.x + CARD_W} ${POS.A.y + CARD_H / 2} H 220`} {...strokeProps} />
          <path d={`M ${POS.B.x + CARD_W} ${POS.B.y + CARD_H / 2} H 220`} {...strokeProps} />
          <path d={`M 220 ${POS.A.y + CARD_H / 2} V ${POS.B.y + CARD_H / 2}`} {...strokeProps} />
          <path d={`M 220 ${POS.C.y + CARD_H / 2} H ${POS.C.x}`} {...strokeProps} />

          {/* D + E → F  (lower round 1 merge) */}
          <path d={`M ${POS.D.x + CARD_W} ${POS.D.y + CARD_H / 2} H 220`} {...strokeProps} />
          <path d={`M ${POS.E.x + CARD_W} ${POS.E.y + CARD_H / 2} H 220`} {...strokeProps} />
          <path d={`M 220 ${POS.D.y + CARD_H / 2} V ${POS.E.y + CARD_H / 2}`} {...strokeProps} />
          <path d={`M 220 ${POS.F.y + CARD_H / 2} H ${POS.F.x}`} {...strokeProps} />

          {/* F → G  (lower semifinal winner into lower final) */}
          <path
            d={`M ${POS.F.x + CARD_W} ${POS.F.y + CARD_H - 15} H ${POS.G.x}`}
            {...strokeProps}
          />

          {/* C loser → G  (drop-down into lower final top slot) */}
          <path
            d={`M ${POS.C.x + CARD_W} ${POS.C.y + CARD_H - 15} H 460 V ${POS.G.y + 15} H ${POS.G.x}`}
            {...strokeProps}
          />

          {/* C winner → GF  (upper final winner into grand final top slot) */}
          <path
            d={`M ${POS.C.x + CARD_W} ${POS.C.y + 15} H ${POS.GF.x}`}
            {...strokeProps}
          />

          {/* G winner → GF  (lower final winner into grand final bottom slot) */}
          <path
            d={`M ${POS.G.x + CARD_W} ${POS.G.y + CARD_H - 15} H 700 V ${POS.GF.y + CARD_H - 15} H ${POS.GF.x}`}
            {...strokeProps}
          />
        </svg>

        {/* ── Match cards ──────────────────────────────────────── */}
        <Card keyName="A"  type="upper" r={0} s={0} />
        <Card keyName="B"  type="upper" r={0} s={1} />
        <Card keyName="C"  type="upper" r={1} s={0} />

        <Card keyName="D"  type="lower" r={0} s={0} />
        <Card keyName="E"  type="lower" r={0} s={1} />
        <Card keyName="F"  type="lower" r={1} s={0} />
        <Card keyName="G"  type="lower" r={2} s={0} />

        <Card keyName="GF" type="grand" r={0} s={0} />
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-[10px] text-gray-500 uppercase tracking-widest flex flex-wrap gap-x-6 gap-y-2">
        <span><span className="text-indigo-300 font-bold">A–C</span> · Upper bracket</span>
        <span><span className="text-amber-400 font-bold">D–G</span> · Lower bracket</span>
        <span><span className="text-green-400 font-bold">GF</span> · Grand final</span>
      </div>
    </div>
  );
}