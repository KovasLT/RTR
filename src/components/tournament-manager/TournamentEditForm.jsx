export default function TournamentEditForm({ editForm, setEditForm, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="bg-[#151922] border border-gray-800/80 rounded-xl p-5 animate-fade-in">
      <h4 className="text-xs font-bold text-indigo-400 uppercase mb-4 border-b border-gray-800 pb-2">Edit Tournament</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title</label><input className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label><select className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.tournamentType} onChange={e => setEditForm({...editForm, tournamentType: e.target.value})}><option value="team">5v5 Team</option><option value="player">1v1 Player</option></select></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Format</label><select className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.format} onChange={e => setEditForm({...editForm, format: e.target.value})}><option value="round_robin">Round Robin</option><option value="playoffs">Single Elimination</option><option value="double_elimination">Double Elimination</option></select></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rewards</label><input className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.rewards} onChange={e => setEditForm({...editForm, rewards: e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Elo</label><input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.minElo} onChange={e => setEditForm({...editForm, minElo: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Elo</label><input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.maxElo} onChange={e => setEditForm({...editForm, maxElo: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start</label><input type="date" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.start} onChange={e => setEditForm({...editForm, start: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End</label><input type="date" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white" value={editForm.end} onChange={e => setEditForm({...editForm, end: e.target.value})} /></div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Save Changes</button>
    </form>
  );
}