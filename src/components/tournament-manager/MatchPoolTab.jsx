import { getParticipantName } from './utils';

export default function MatchPoolTab({ matches, participants, tournamentType, onToggleFlag }) {
  return (
    <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 animate-fade-in">
      <div className="mb-4 border-b border-gray-800 pb-4">
        <h4 className="text-sm font-bold text-white"><i className="fas fa-list-ul text-indigo-400 mr-2"></i>Reported Matches Pool</h4>
        <p className="text-xs text-gray-500 mt-1">Flag any match that is incorrect – flagged matches will NOT affect standings or bracket assignments.</p>
      </div>
      {matches.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">No reported matches for this tournament yet.</div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {matches.map(m => (
            <div key={m.id} className={`bg-gray-900 border rounded-lg p-3 flex justify-between items-center ${m.flagged ? 'border-red-800/50 bg-red-950/20' : 'border-gray-700'}`}>
              <div className="flex-1">
                <div className="text-sm font-mono">
                  <span className="text-white">{getParticipantName(m.team_a_id, participants, tournamentType)}</span>
                  <span className="mx-2 text-gray-500">vs</span>
                  <span className="text-white">{getParticipantName(m.team_b_id, participants, tournamentType)}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Score: {m.score_team_a} - {m.score_team_b} &nbsp;|&nbsp;
                  Reported: {new Date(m.created_at).toLocaleString()} &nbsp;|&nbsp;
                  Status: {m.status}
                </div>
              </div>
              <button
                onClick={() => onToggleFlag(m.id, m.flagged)}
                className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors ${m.flagged ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-red-900/50 text-red-300 hover:bg-red-800/70'}`}
              >
                {m.flagged ? 'Mark as Valid' : 'Flag as FALSE'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}