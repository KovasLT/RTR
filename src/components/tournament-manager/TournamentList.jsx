export default function TournamentList({ tournaments, onSelectTournament, onCreateNew }) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
        <p className="text-gray-500 mb-4">No tournaments yet.</p>
        <button onClick={onCreateNew} className="text-xs bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 px-4 py-2 rounded">Create First Tournament</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-semibold text-gray-500 mb-3 uppercase text-[10px]">Managed Tournaments</p>
      {tournaments.map(t => (
        <div key={t.id} className="p-4 bg-[#151922] border border-gray-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-700 transition-colors">
          <div>
            <div className="text-white font-semibold">{t.title}</div>
            <div className="text-xs text-gray-500 flex gap-2 mt-1">
              <span className="capitalize font-bold text-indigo-400">{t.tournament_type === 'player' ? '1v1' : '5v5'}</span>
              <span>•</span>
              <span>{t.format?.replace('_', ' ')}</span>
              <span>•</span>
              <span>Elo {t.min_elo}-{t.max_elo}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${t.status === 'registration' ? 'bg-amber-950/50 text-amber-400 border-amber-900/50' : t.status === 'ongoing' ? 'bg-green-950/50 text-green-400 border-green-900/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{t.status}</span>
            <button onClick={() => onSelectTournament(t.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-2 shadow-md">Manage</button>
          </div>
        </div>
      ))}
    </div>
  );
}