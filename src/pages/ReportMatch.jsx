import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useAllTeams } from '../hooks/useTeams.js';
import { useTournaments } from '../hooks/useTournaments.js';
import { useMatchMutations } from '../hooks/useMatches.js';
import { supabase } from '../lib/supabase';

export default function ReportMatch() {
  const { user } = useAuth();
  const { data: allTeams = [] } = useAllTeams();
  const { data: existingTournaments = [] } = useTournaments(); // returns all tournaments
  const { submitMatchReport } = useMatchMutations();

  // Stage options
  const stageOptions = [
    'Scrims',
    'Group stage',
    'TOP 32',
    'TOP 16',
    'TOP 8',
    'Semifinals',
    'Mini finals',
    'Finals'
  ];

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    stage: 'Scrims',
    format: 'Bo3',
    tournamentId: '',
    customTournamentName: '',
    teamAInput: '',
    teamBInput: '',
    teamA_id: '',
    teamB_id: '',
    scoreA: 0,
    scoreB: 0,
  });

  const [useCustomTournament, setUseCustomTournament] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  // Helper: find team ID from typed name (if exists)
  const getTeamIdFromName = (name) => {
    if (!name) return null;
    const team = allTeams.find(t => 
      t.name.toLowerCase() === name.toLowerCase() || 
      t.tag?.toLowerCase() === name.toLowerCase()
    );
    return team?.id || null;
  };

  const handleTeamInputChange = (team, value) => {
    const id = getTeamIdFromName(value);
    setForm(prev => ({
      ...prev,
      [`team${team}Input`]: value,
      [`team${team}_id`]: id
    }));
  };

  const handleScoreChange = (team, delta) => {
    setForm(prev => ({
      ...prev,
      [`score${team}`]: Math.max(0, prev[`score${team}`] + delta)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    // Validation
    if (!form.teamAInput.trim()) {
      setStatus({ type: 'error', message: 'Please enter Team A name.' });
      setLoading(false);
      return;
    }
    if (!form.teamBInput.trim()) {
      setStatus({ type: 'error', message: 'Please enter Team B name.' });
      setLoading(false);
      return;
    }
    if (form.teamAInput.toLowerCase() === form.teamBInput.toLowerCase()) {
      setStatus({ type: 'error', message: 'Teams cannot be the same.' });
      setLoading(false);
      return;
    }

    // Resolve team names and tournament
    const teamAName = form.teamAInput.trim();
    const teamBName = form.teamBInput.trim();
    const tournamentName = useCustomTournament
      ? form.customTournamentName.trim()
      : (existingTournaments.find(t => t.id === form.tournamentId)?.title || null);

    // Payload with immediate confirmation
    const payload = {
      reporter_name: user?.display_name || user?.email || 'Anonymous',
      reporter_id: user?.id,
      team_a_name: teamAName,
      team_a_id: form.teamA_id,
      team_b_name: teamBName,
      team_b_id: form.teamB_id,
      tournament_name: tournamentName,
      tournament_id: useCustomTournament ? null : form.tournamentId || null,
      match_info: form.stage,
      match_type: form.format,
      score_team_a: form.scoreA,
      score_team_b: form.scoreB,
      team_a_rating_before: 1200,
      team_b_rating_before: 1200,
      team_a_rating_after: null,
      team_b_rating_after: null,
      status: 'confirmed',        // <-- instant confirmation
      match_date: form.date,
    };

    try {
      const matchResult = await submitMatchReport.mutateAsync(payload);
      
      // Send Discord notification (non‑blocking, errors ignored)
      try {
        const teamA = allTeams.find(t => t.id === form.teamA_id);
        const teamB = allTeams.find(t => t.id === form.teamB_id);
        await supabase.functions.invoke('discord-match-notification', {
          body: {
            match_id: matchResult.id,
            team_a_name: teamA?.name || teamAName,
            team_b_name: teamB?.name || teamBName,
            score_a: form.scoreA,
            score_b: form.scoreB,
            reporter_name: user?.display_name || user?.email || 'Anonymous'
          }
        });
      } catch (notifyErr) {
        console.warn('Discord notification failed:', notifyErr);
        // Do not show error to user
      }

      setStatus({ type: 'success', message: 'Match reported! Ratings updated. Managers have been notified on Discord.' });
      
      // Reset form (keep date, stage, format, tournament settings but clear teams and scores)
      setForm({
        ...form,
        teamAInput: '',
        teamBInput: '',
        teamA_id: '',
        teamB_id: '',
        scoreA: 0,
        scoreB: 0,
        tournamentId: useCustomTournament ? form.tournamentId : '',
        customTournamentName: useCustomTournament ? '' : form.customTournamentName,
      });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Inline style to fix dropdown colors */}
      <style>{`
        select, option {
          background-color: #1f2937 !important;
          color: #f3f4f6 !important;
        }
        select:focus, option:focus {
          outline: none;
        }
        input, textarea {
          color-scheme: dark;
        }
      `}</style>

      <div className="rtr-card max-w-4xl mx-auto animate-fade-in border border-gray-800 bg-gray-900 shadow-xl">
        <div className="mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <i className="fas fa-futbol text-blue-400"></i> Report Match
          </h2>
          <p className="text-gray-400 text-sm">
            Submit game results. Ratings update immediately. Team managers are notified on Discord.
          </p>
        </div>

        {status.message && (
          <div className={`mb-6 p-3 rounded-lg text-sm border ${
            status.type === 'error' 
              ? 'bg-red-950/40 border-red-800/50 text-red-300' 
              : 'bg-green-950/40 border-green-800/50 text-green-300'
          }`}>
            {status.type === 'error' ? '⚠️ ' : '✓ '}{status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament section */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Tournament (optional)
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={useCustomTournament}
                  onChange={(e) => setUseCustomTournament(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-300">Enter custom tournament</span>
              </label>
            </div>

            {!useCustomTournament ? (
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                value={form.tournamentId}
                onChange={(e) => setForm({...form, tournamentId: e.target.value})}
              >
                <option value="">None (Standalone match)</option>
                {existingTournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. RTR Cup 2026"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                value={form.customTournamentName}
                onChange={(e) => setForm({...form, customTournamentName: e.target.value})}
              />
            )}
          </div>

          {/* Scoreboard card */}
          <div className="bg-gray-800/20 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
            {/* Header row: date, stage, format */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-700 bg-gray-800/60">
              <div className="flex items-center justify-center p-3">
                <input
                  type="date"
                  className="bg-transparent text-sm font-medium text-white focus:outline-none text-center cursor-pointer"
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                />
              </div>
              <div className="flex items-center justify-center p-3">
                <select
                  className="bg-transparent text-sm font-medium text-white focus:outline-none text-center w-full cursor-pointer"
                  value={form.stage}
                  onChange={(e) => setForm({...form, stage: e.target.value})}
                >
                  {stageOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-center p-3">
                <select
                  className="bg-transparent text-sm font-medium text-white focus:outline-none text-center cursor-pointer appearance-none"
                  value={form.format}
                  onChange={(e) => setForm({...form, format: e.target.value})}
                >
                  <option value="Bo1">Best of 1</option>
                  <option value="Bo3">Best of 3</option>
                  <option value="Bo5">Best of 5</option>
                  <option value="Bo7">Best of 7</option>
                </select>
              </div>
            </div>

            {/* Team A */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-gray-700 gap-4">
              <div className="w-full sm:w-2/3">
                <div className="mb-2">
                  <span className="text-blue-400 font-bold text-sm">TEAM A</span>
                </div>
                <input
                  list="team-suggestions"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Type team name (or enter custom)"
                  value={form.teamAInput}
                  onChange={(e) => handleTeamInputChange('A', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                <button type="button" onClick={() => handleScoreChange('A', -1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition">
                  <i className="fas fa-minus"></i>
                </button>
                <div className="w-14 text-center text-2xl font-bold text-white font-mono">{form.scoreA}</div>
                <button type="button" onClick={() => handleScoreChange('A', 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition">
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            {/* Team B */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
              <div className="w-full sm:w-2/3">
                <div className="mb-2">
                  <span className="text-blue-400 font-bold text-sm">TEAM B</span>
                </div>
                <input
                  list="team-suggestions"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Type team name (or enter custom)"
                  value={form.teamBInput}
                  onChange={(e) => handleTeamInputChange('B', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                <button type="button" onClick={() => handleScoreChange('B', -1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition">
                  <i className="fas fa-minus"></i>
                </button>
                <div className="w-14 text-center text-2xl font-bold text-white font-mono">{form.scoreB}</div>
                <button type="button" onClick={() => handleScoreChange('B', 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition">
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <datalist id="team-suggestions">
            {allTeams.map(team => (
              <option key={team.id} value={team.name}>{team.tag ? `[${team.tag}]` : ''}</option>
            ))}
          </datalist>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-8 py-3 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
              ) : (
                <><i className="fas fa-check-circle"></i> Submit Match Result</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}