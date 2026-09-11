import { getParticipantName } from './utils';

// ─────────────────────────────────────────────────────────────────────
//  Layout constants — everything is absolutely positioned on one canvas
// ─────────────────────────────────────────────────────────────────────
const CARD_W = 200;
const CARD_H = 80;

const POS = {
  // Upper bracket
  A:  { x: 0,   y: 50  },
  B:  { x: 0,   y: 165 },
  C:  { x: 240, y: 107 },
  // Lower bracket
  D:  { x: 0,   y: 320 },
  E:  { x: 0,   y: 435 },
  F:  { x: 240, y: 377 },
  G:  { x: 480, y: 377 },
  // Grand final
  GF: { x: 720, y: 107 },
};

const CONTAINER_W = 940;
const CONTAINER_H = 560;

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
        <div className="flex justify-between items-center h-[26px]">
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
        <div className="flex justify-between items-center h-[26px]">
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
const ColumnHeader = ({ x, y, width = CARD_W, children }) => (
  <div
    style={{ position: 'absolute', left: x, top: y, width }}
    className="bg-gray-700/80 text-gray-100 text-[11px] font-medium rounded px-3 py-1.5 text-center tracking-wide"
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

  const strokeProps = { stroke: '#4b5563', strokeWidth: 1.5, fill: 'none' };

  // Reference card edges for the connectors
  const rightOf  = (k) => POS[k].x + CARD_W;
  const leftOf   = (k) => POS[k].x;
  const slotAy   = (k) => POS[k].y + 34;   // top row of the card (center)
  const slotBy   = (k) => POS[k].y + 60;   // bottom row of the card (center)
  const midY     = (k) => POS[k].y + CARD_H / 2;

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
        {/* Upper bracket */}
        <ColumnHeader x={POS.A.x}  y={0}>Upper Bracket Round 1</ColumnHeader>
        <ColumnHeader x={POS.C.x}  y={0}>Upper Bracket Final</ColumnHeader>
        <ColumnHeader x={POS.GF.x} y={0}>Grand Final</ColumnHeader>

        {/* Lower bracket */}
        <ColumnHeader x={POS.D.x} y={270}>Lower Bracket Round 1</ColumnHeader>
        <ColumnHeader x={POS.F.x} y={270}>Lower Bracket Semifinal</ColumnHeader>
        <ColumnHeader x={POS.G.x} y={270}>Lower Bracket Final</ColumnHeader>

        {/* ── Connector lines ──────────────────────────────────── */}
        <svg
          width={CONTAINER_W}
          height={CONTAINER_H}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* A + B → C  (upper round 1 merge) */}
          <path d={`M ${rightOf('A')} ${midY('A')} H 220`} {...strokeProps} />
          <path d={`M ${rightOf('B')} ${midY('B')} H 220`} {...strokeProps} />
          <path d={`M 220 ${midY('A')} V ${midY('B')}`} {...strokeProps} />
          <path d={`M 220 ${midY('C')} H ${leftOf('C')}`} {...strokeProps} />

          {/* C winner → Grand Final (top slot) */}
          <path
            d={`M ${rightOf('C')} ${slotAy('C')} H ${leftOf('GF')}`}
            {...strokeProps}
          />

          {/* C loser → G (top slot) — drop down on the right */}
          <path
            d={`M ${rightOf('C')} ${slotBy('C')} H 455 V ${slotAy('G')} H ${leftOf('G')}`}
            {...strokeProps}
          />

          {/* D + E → F  (lower round 1 merge) */}
          <path d={`M ${rightOf('D')} ${midY('D')} H 220`} {...strokeProps} />
          <path d={`M ${rightOf('E')} ${midY('E')} H 220`} {...strokeProps} />
          <path d={`M 220 ${midY('D')} V ${midY('E')}`} {...strokeProps} />
          <path d={`M 220 ${midY('F')} H ${leftOf('F')}`} {...strokeProps} />

          {/* F winner → G (bottom slot) */}
          <path
            d={`M ${rightOf('F')} ${slotAy('F')} H 470 V ${slotBy('G')} H ${leftOf('G')}`}
            {...strokeProps}
          />

          {/* G winner → Grand Final (bottom slot) — right then up */}
          <path
            d={`M ${rightOf('G')} ${slotBy('G')} H 700 V ${slotBy('GF')} H ${leftOf('GF')}`}
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
        <span><span className="text-green-400 font-bold">Finals</span> · Grand final</span>
      </div>
    </div>
  );
}