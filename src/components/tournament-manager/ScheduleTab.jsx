import { getParticipantName } from './utils';

export default function ScheduleTab({ 
  scheduledMatches, 
  participants, 
  tournamentType, 
  onUpdateMatch, 
  onAddMatch, 
  onRemoveMatch, 
  onGenerateRoundRobin, 
  onSave 
}) {
  return (
    <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 animate-fade-in">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4 flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-bold text-white"><i className="fas fa-calendar-alt text-indigo-400 mr-2"></i>Schedule & Results</h4>
          <p className="text-xs text-gray-500 mt-1">Set match dates/times. Scores are managed via the Match Pool.</p>
        </div>
        <div className="flex gap-2">
          {onGenerateRoundRobin && (
            <button onClick={onGenerateRoundRobin} className="bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded font-bold">Propose Schedule</button>
          )}
          <button onClick={onAddMatch} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-xs px-3 py-1.5 rounded font-bold">+ Add Match</button>
          <button onClick={onSave} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded font-bold">Save Data</button>
        </div>
      </div>

      {scheduledMatches.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          No matches scheduled yet. Use "Propose Schedule" for round robin or add manually.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {scheduledMatches.map((match, index) => (
            <div key={match.id} className="bg-gray-900 border border-gray-800 p-3 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-3 items-center hover:border-gray-700 transition-colors">
              <div className="lg:col-span-1 text-[10px] text-gray-500 font-mono font-bold">MATCH {index + 1}</div>
              <div className="lg:col-span-4">
                <select className="w-full bg-gray-800 text-xs text-white p-2 rounded border border-gray-700" value={match.p1} onChange={(e) => onUpdateMatch(match.id, 'p1', e.target.value)}>
                  <option value="">Select Participant</option>
                  {participants.map(p => {
                    const id = p.team_id || p.player_id;
                    return <option key={id} value={id}>{getParticipantName(id, participants, tournamentType)}</option>
                  })}
                </select>
              </div>
              <div className="lg:col-span-1 flex justify-center text-gray-600 text-[10px] font-bold">VS</div>
              <div className="lg:col-span-4">
                <select className="w-full bg-gray-800 text-xs text-white p-2 rounded border border-gray-700" value={match.p2} onChange={(e) => onUpdateMatch(match.id, 'p2', e.target.value)}>
                  <option value="">Select Participant</option>
                  {participants.map(p => {
                    const id = p.team_id || p.player_id;
                    return <option key={id} value={id}>{getParticipantName(id, participants, tournamentType)}</option>
                  })}
                </select>
              </div>
              <div className="lg:col-span-2">
                <input type="datetime-local" className="w-full bg-gray-800 text-[10px] text-white p-2 rounded border border-gray-700" value={match.datetime} onChange={(e) => onUpdateMatch(match.id, 'datetime', e.target.value)} />
              </div>
              <div className="lg:col-span-1">
                <button onClick={() => onRemoveMatch(match.id)} className="text-red-500 hover:text-red-400 p-1"><i className="fas fa-trash text-xs"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}