export default function TournamentCreationWizard({ form, setForm, onSubmit, isPending }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Competition Title</label>
          <input required placeholder="e.g. Summer Skirmish 2026" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tournament Type</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.tournamentType} onChange={e => setForm({...form, tournamentType: e.target.value})}>
            <option value="team">5v5 (Team)</option>
            <option value="player">1v1 (Player)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Format Scheme</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.format} onChange={e => setForm({...form, format: e.target.value})}>
            <option value="round_robin">Round Robin</option>
            <option value="playoffs">Single Elimination</option>
            <option value="double_elimination">Double Elimination</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rewards / Description</label>
          <input placeholder="Prizes, rules..." className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.rewards} onChange={e => setForm({...form, rewards: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Elo</label><input type="number" placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.minElo} onChange={e => setForm({...form, minElo: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Elo</label><input type="number" placeholder="3000" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.maxElo} onChange={e => setForm({...form, maxElo: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Date</label><input type="date" required className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.start} onChange={e => setForm({...form, start: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Date</label><input type="date" required className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={form.end} onChange={e => setForm({...form, end: e.target.value})} /></div>
      </div>
      <button type="submit" disabled={isPending} className="w-full mt-4 text-sm font-bold bg-green-600 hover:bg-green-500 text-white rounded py-2.5">Create Tournament</button>
    </form>
  );
}