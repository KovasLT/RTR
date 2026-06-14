export default function OverviewTab({ tournament, participants, loadingParticipants, onRemoveParticipant }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-[#1a1c23] border border-gray-800/80 rounded-xl p-5">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-4">Tournament Info</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><div className="text-gray-500 text-xs">Type</div><div className="text-white">{tournament.tournament_type === 'player' ? '1v1 Player' : '5v5 Team'}</div></div>
          <div><div className="text-gray-500 text-xs">Format</div><div className="text-white capitalize">{tournament.format?.replace('_', ' ')}</div></div>
          <div><div className="text-gray-500 text-xs">Elo Range</div><div className="text-white">{tournament.min_elo} – {tournament.max_elo}</div></div>
          <div><div className="text-gray-500 text-xs">Start</div><div className="text-white">{tournament.start_date || 'TBD'}</div></div>
          <div><div className="text-gray-500 text-xs">End</div><div className="text-white">{tournament.end_date || 'TBD'}</div></div>
          <div className="col-span-2"><div className="text-gray-500 text-xs">Description</div><div className="text-gray-300">{tournament.description || '—'}</div></div>
        </div>
      </div>

      <div className="border border-gray-800 bg-[#151922] rounded-xl p-5">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <i className="fas fa-users text-indigo-400"></i> Registered {tournament.tournament_type === 'team' ? 'Teams' : 'Players'}
        </h4>
        {loadingParticipants ? (
          <div className="text-xs text-gray-500">Loading...</div>
        ) : participants.length === 0 ? (
          <div className="text-xs text-gray-500">No participants yet.</div>
        ) : (
          <div className="space-y-2">
            {participants.map(p => (
              <div key={p.team_id || p.player_id} className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0">
                <div>
                  {tournament.tournament_type === 'team' ? (
                    <span className="text-white font-semibold">{p.teams?.name} {p.teams?.tag ? <span className="text-gray-400 font-normal">[{p.teams.tag}]</span> : ''}</span>
                  ) : (
                    <span className="text-white font-semibold">{p.profiles?.display_name || p.profiles?.handle || 'Unknown'}</span>
                  )}
                  {p.placement && <span className="ml-2 text-xs text-amber-400">Placement: #{p.placement}</span>}
                </div>
                <button onClick={() => onRemoveParticipant(p.team_id || p.player_id)} className="text-xs text-red-400 hover:text-red-300 bg-red-950/30 px-2 py-1 rounded">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}