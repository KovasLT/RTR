import { useState, useEffect } from 'react';
import { useTournaments } from '../hooks/useTournaments.js';
import { APP_CONSTANTS } from '../app-constants';

export default function TournamentManagerPanel({ rating, userId }) {
  // Assuming your hook exports an update mutation alongside create. 
  // If not, you will need to add it to useTournaments.js
  const { data: tournaments = [], createTournament, updateTournament } = useTournaments(userId);
  
  // Primary Navigation States
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  
  // Secondary State for the Management View
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Creation Form State
  const [form, setForm] = useState({ 
    title: '', 
    format: 'round_robin', 
    rewards: '', 
    minElo: '', 
    maxElo: '', 
    start: '', 
    end: '' 
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    format: '',
    rewards: '',
    minElo: 0,
    maxElo: 3000,
    start: '',
    end: ''
  });

  const currentTournament = tournaments.find(t => t.id === selectedTournamentId);

  // Synchronize the edit form whenever a new tournament is selected
  useEffect(() => {
    if (currentTournament) {
      setEditForm({
        title: currentTournament.title || '',
        format: currentTournament.format || 'round_robin',
        rewards: currentTournament.description || '', // Assuming 'description' holds rewards in DB
        minElo: currentTournament.min_elo || 0,
        maxElo: currentTournament.max_elo || 3000,
        start: currentTournament.start_date || '',
        end: currentTournament.end_date || ''
      });
    }
  }, [currentTournament]);

  // --- Handlers ---

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    
    try {
      await createTournament.mutateAsync({
        title: form.title,
        description: form.rewards,
        format: form.format,
        min_elo: parseInt(form.minElo) || 0,
        max_elo: parseInt(form.maxElo) || 3000,
        start_date: form.start,
        end_date: form.end,
        status: 'registration'
      });
      
      setIsCreating(false);
      setForm({ title: '', format: 'round_robin', rewards: '', minElo: '', maxElo: '', start: '', end: '' });
    } catch (err) {
      console.error("Tournament creation failed:", err);
      setErrorMsg(err.message || "Failed to generate tournament node.");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (updateTournament) {
        await updateTournament.mutateAsync({
          id: selectedTournamentId,
          title: editForm.title,
          description: editForm.rewards,
          format: editForm.format,
          min_elo: parseInt(editForm.minElo) || 0,
          max_elo: parseInt(editForm.maxElo) || 3000,
          start_date: editForm.start,
          end_date: editForm.end,
        });
      } else {
        console.warn("updateTournament mutation is not defined in useTournaments hook.");
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Tournament update failed:", err);
      setErrorMsg(err.message || "Failed to update framework.");
    }
  };

  const closeManageView = () => {
    setSelectedTournamentId(null);
    setIsEditing(false);
    setErrorMsg(null);
  };

  return (
    <div className="rtr-card relative min-h-[400px]">
      
      {/* ----------------------------------------------------------------- */}
      {/* GLOBAL HEADER                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="fas fa-trophy text-indigo-300"></i>
          {selectedTournamentId && currentTournament
            ? `Managing: ${currentTournament.title}` 
            : "Tournament Manager Controls Hub"}
        </h3>
        
        {/* Dynamic Buttons based on current view */}
        <div className="flex items-center gap-3">
          {selectedTournamentId ? (
            <>
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`text-xs font-semibold rounded px-4 py-1.5 transition-colors ${
                  isEditing 
                    ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-600" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Framework'}
              </button>
              <button 
                onClick={closeManageView} 
                className="text-xs bg-gray-800 border border-gray-600 text-gray-300 hover:border-gray-500 rounded px-4 py-1.5 transition-colors"
              >
                Back to List
              </button>
            </>
          ) : (
            <>
              {rating != null && (
                <span className="text-indigo-300 font-mono font-bold text-sm mr-2 hidden sm:inline">
                  Rating: {rating}
                </span>
              )}
              <button 
                onClick={() => {
                  setIsCreating(!isCreating);
                  setErrorMsg(null);
                }}
                className={`text-xs font-semibold rounded px-4 py-1.5 transition-colors ${
                  isCreating 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {isCreating ? "Back to Dashboard" : "+ Create New Tournament"}
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-lg text-sm animate-fade-in">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 1: CREATION WIZARD                                           */}
      {/* ----------------------------------------------------------------- */}
      {isCreating && !selectedTournamentId && (
        <form onSubmit={handleCreateSubmit} className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Competition Title</label>
              <input 
                required 
                placeholder="e.g. Summer Skirmish 2026"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Format Scheme</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" 
                value={form.format} 
                onChange={e => setForm({...form, format: e.target.value})}
              >
                <option value="round_robin">Round Robin Matrix</option>
                <option value="playoffs">Single Elimination Bracket</option>
                <option value="double_elimination">Double Elimination Bracket</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Information / Reward Specifications</label>
            <input 
              placeholder="Prizes, rules, schedule notes..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" 
              value={form.rewards} 
              onChange={e => setForm({...form, rewards: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Min Elo</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" 
                value={form.minElo} 
                onChange={e => setForm({...form, minElo: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Max Elo</label>
              <input 
                type="number" 
                placeholder="3000"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" 
                value={form.maxElo} 
                onChange={e => setForm({...form, maxElo: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
              <input 
                required 
                type="date" 
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" 
                value={form.start} 
                onChange={e => setForm({...form, start: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
              <input 
                required 
                type="date" 
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500" 
                value={form.end} 
                onChange={e => setForm({...form, end: e.target.value})} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={createTournament?.isPending}
            className="w-full mt-4 text-sm font-bold bg-[#22c55e] hover:bg-green-400 text-gray-900 rounded py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createTournament?.isPending ? "Connecting to Database..." : "Commit Tournament Generation Node"}
          </button>
        </form>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 2: DEEP MANAGEMENT WORKSPACE                                 */}
      {/* ----------------------------------------------------------------- */}
      {!isCreating && selectedTournamentId && currentTournament && (
        <div className="space-y-6 animate-fade-in">
          
          {isEditing ? (
             /* --- EDIT MODE FORM --- */
            <form onSubmit={handleUpdateSubmit} className="bg-[#151922] border border-gray-800/80 rounded-xl p-5 shadow-inner">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Modify Framework Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Competition Title</label>
                  <input 
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Format Scheme</label>
                  <select 
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={editForm.format} onChange={(e) => setEditForm({...editForm, format: e.target.value})}
                  >
                    <option value="round_robin">Round Robin Matrix</option>
                    <option value="playoffs">Single Elimination Bracket</option>
                    <option value="double_elimination">Double Elimination Bracket</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Information / Reward Specifications</label>
                <textarea 
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  value={editForm.rewards} onChange={(e) => setEditForm({...editForm, rewards: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Min Elo</label>
                  <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500" value={editForm.minElo} onChange={(e) => setEditForm({...editForm, minElo: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Max Elo</label>
                  <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500" value={editForm.maxElo} onChange={(e) => setEditForm({...editForm, maxElo: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                  <input type="date" required className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500" value={editForm.start} onChange={(e) => setEditForm({...editForm, start: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                  <input type="date" required className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500" value={editForm.end} onChange={(e) => setEditForm({...editForm, end: e.target.value})} />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2 transition-colors"
              >
                Save Framework Adjustments
              </button>
            </form>
          ) : (
            /* --- READ-ONLY DATA VIEW --- */
            <div className="bg-[#1a1c23] border border-gray-800/80 rounded-xl p-5 shadow-sm">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Framework Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 text-sm">
                <div className="col-span-2 md:col-span-1">
                  <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Format Scheme</div>
                  <div className="text-white font-medium capitalize">{currentTournament.format?.replace('_', ' ') || '—'}</div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Elo Requirements</div>
                  <div className="text-white font-medium">
                    <span className="text-indigo-300 font-mono">{currentTournament.min_elo}</span> 
                    <span className="mx-1 text-gray-600">-</span> 
                    <span className="text-indigo-300 font-mono">{currentTournament.max_elo}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">Start Boundary</div>
                  <div className="text-white font-medium">{currentTournament.start_date || 'TBD'}</div>
                </div>
                <div className="col-span-1">
                  <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-1">End Boundary</div>
                  <div className="text-white font-medium">{currentTournament.end_date || 'TBD'}</div>
                </div>
                <div className="col-span-2 md:col-span-4 mt-2">
                  <div className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Information / Reward Specifications</div>
                  <div className="text-gray-300 bg-[#12141a] rounded-lg border border-gray-800 p-4 whitespace-pre-wrap min-h-[60px]">
                    {currentTournament.description || 'No additional specifications provided.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Hub Panels (Visible in both Read and Edit modes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-800 bg-[#151922] p-5 rounded-xl">
              <h4 className="text-sm font-bold text-white mb-3">
                <i className="fas fa-users-cog mr-2 text-amber-400"></i>Pending Registrations
              </h4>
              <p className="text-xs text-gray-500 py-6 text-center border border-dashed border-gray-800/80 rounded-lg bg-black/20">
                No active team submissions awaiting validation vectors.
              </p>
            </div>
            <div className="border border-gray-800 bg-[#151922] p-5 rounded-xl">
              <h4 className="text-sm font-bold text-white mb-3">
                <i className="fas fa-scroll mr-2 text-indigo-400"></i>Reports & Control Blocks
              </h4>
              <p className="text-xs text-gray-500 py-6 text-center border border-dashed border-gray-800/80 rounded-lg bg-black/20">
                Match nodes, finalizations, and manual updates arrive in Phase 2.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 3: DEFAULT LIST VIEW                                         */}
      {/* ----------------------------------------------------------------- */}
      {!isCreating && !selectedTournamentId && (
        <div className="mt-2 text-sm text-gray-400 animate-fade-in">
          {tournaments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/10">
              <i className="fas fa-folder-open text-3xl text-gray-700 mb-3 block"></i>
              <p className="text-gray-500 mb-4">No active competitive frameworks managed by your profile credentials.</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="text-xs font-bold bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/40 text-indigo-300 px-4 py-2 rounded-lg transition-colors"
              >
                Launch Your First Tournament Node
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-gray-500 mb-3 tracking-wide uppercase text-[10px]">Managed Framework Networks</p>
              {tournaments.map(t => (
                <div key={t.id} className="p-4 bg-[#151922] border border-gray-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-600 transition-colors group">
                  <div>
                    <div className="text-white font-semibold text-base mb-1 group-hover:text-indigo-300 transition-colors">{t.title}</div>
                    <div className="text-xs text-gray-500 capitalize flex items-center gap-2">
                      <span>{t.format.replace('_', ' ')}</span>
                      <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                      <span className="font-mono">Elo: {t.min_elo}-{t.max_elo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-mono font-bold tracking-wide border ${
                      t.status === 'registration' ? 'bg-amber-950/50 text-amber-400 border-amber-900/50' :
                      t.status === 'ongoing' ? 'bg-green-950/50 text-green-400 border-green-900/50' :
                      'bg-gray-800 text-gray-400 border-gray-700'
                    }`}>
                      {t.status}
                    </span>
                    <button 
                      onClick={() => setSelectedTournamentId(t.id)}
                      className="text-xs font-bold bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-white rounded px-4 py-2 transition-all shadow-sm"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}