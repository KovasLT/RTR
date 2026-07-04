import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useAllTeams } from '../hooks/useTeams.js';
import { useTournaments } from '../hooks/useTournaments.js';
import { useDirectory } from '../hooks/useProfiles.js';
import { supabase } from '../lib/supabase';

export default function ReportMatch() {
  const { user } = useAuth();
  const { data: allTeams = [] } = useAllTeams();
  const { data: allTournaments = [] } = useTournaments();
  const { data: directory = [] } = useDirectory();

  const [matchType, setMatchType] = useState('5v5');
  const filteredTournaments = allTournaments.filter(t =>
    matchType === '5v5' ? t.tournament_type !== 'player' : t.tournament_type === 'player'
  );

  const stageOptions = [
    'Scrims', 'Group stage', 'TOP 32', 'TOP 16', 'TOP 8',
    'Semifinals', 'Mini finals', 'Finals'
  ];

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
    playerAInput: '',
    playerBInput: '',
    playerA_id: '',
    playerB_id: '',
    scoreA: 0,
    scoreB: 0,
  });

  const [useCustomTournament, setUseCustomTournament] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const players = directory.filter(p => p.roles?.includes('player'));

  const getTeamIdFromName = (name) => {
    if (!name) return null;
    const team = allTeams.find(t =>
      t.name.toLowerCase() === name.toLowerCase() ||
      t.tag?.toLowerCase() === name.toLowerCase()
    );
    return team?.id || null;
  };

  const getPlayerIdFromName = (name) => {
    if (!name) return null;
    const player = players.find(p =>
      (p.display_name || p.handle || '').toLowerCase() === name.toLowerCase()
    );
    return player?.id || null;
  };

  const handleTeamAChange = (value) => {
    const id = getTeamIdFromName(value);
    setForm(prev => ({ ...prev, teamAInput: value, teamA_id: id }));
  };
  const handleTeamBChange = (value) => {
    const id = getTeamIdFromName(value);
    setForm(prev => ({ ...prev, teamBInput: value, teamB_id: id }));
  };
  const handlePlayerAChange = (value) => {
    const id = getPlayerIdFromName(value);
    setForm(prev => ({ ...prev, playerAInput: value, playerA_id: id }));
  };
  const handlePlayerBChange = (value) => {
    const id = getPlayerIdFromName(value);
    setForm(prev => ({ ...prev, playerBInput: value, playerB_id: id }));
  };

  const handleScoreChange = (team, delta) => {
    setForm(prev => ({
      ...prev,
      [`score${team}`]: Math.max(0, prev[`score${team}`] + delta)
    }));
  };

  const ensurePlayerProfile = async (name) => {
    const existing = players.find(p => (p.display_name || p.handle) === name);
    if (existing) return existing.id;
    const { data, error } = await supabase
      .from('profiles')
      .insert({ display_name: name, handle: name.toLowerCase().replace(/\s/g, '') })
      .select('id')
      .single();
    if (error) throw new Error('Could not create player profile');
    return data.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    const isPlayerMatch = matchType === '1v1';

    if (isPlayerMatch) {
      if (!form.playerAInput.trim() || !form.playerBInput.trim()) {
        setStatus({ type: 'error', message: 'Please enter both player names.' });
        setLoading(false);
        return;
      }
      if (form.playerAInput.trim().toLowerCase() === form.playerBInput.trim().toLowerCase()) {
        setStatus({ type: 'error', message: 'Players cannot be the same.' });
        setLoading(false);
        return;
      }
    } else {
      if (!form.teamAInput.trim() || !form.teamBInput.trim()) {
        setStatus({ type: 'error', message: 'Please enter both team names.' });
        setLoading(false);
        return;
      }
      if (form.teamAInput.trim().toLowerCase() === form.teamBInput.trim().toLowerCase()) {
        setStatus({ type: 'error', message: 'Teams cannot be the same.' });
        setLoading(false);
        return;
      }
    }

    let tournamentId = null;
    let tournamentName = null;
    if (useCustomTournament) {
      tournamentName = form.customTournamentName.trim();
    } else {
      tournamentId = form.tournamentId || null;
      if (tournamentId) {
        const tourney = allTournaments.find(t => t.id === tournamentId);
        tournamentName = tourney?.title || null;
      }
    }

    try {
      const matchData = {
        tournament_id: tournamentId,
        match_date: form.date,
        match_type: form.format,
        stage: form.stage,
        score_team_a: form.scoreA,
        score_team_b: form.scoreB,
        status: 'pending',
        approved: false,
        flagged: false,
        reporter_id: user?.id,
        reporter_name: user?.display_name || user?.email || 'Anonymous',
        created_at: new Date().toISOString(),
      };

      if (isPlayerMatch) {
        const playerAId = form.playerA_id || (await ensurePlayerProfile(form.playerAInput));
        const playerBId = form.playerB_id || (await ensurePlayerProfile(form.playerBInput));
        matchData.team_a_id = playerAId;
        matchData.team_b_id = playerBId;
        matchData.match_type = '1v1';
      } else {
        matchData.team_a_id = form.teamA_id;
        matchData.team_b_id = form.teamB_id;
      }

      const { error } = await supabase.from('matches').insert(matchData);
      if (error) throw error;

      setStatus({ type: 'success', message: 'Match reported! Waiting for admin approval.' });
      // Reset form
      setForm(prev => ({
        ...prev,
        teamAInput: '', teamBInput: '', teamA_id: '', teamB_id: '',
        playerAInput: '', playerBInput: '', playerA_id: '', playerB_id: '',
        scoreA: 0, scoreB: 0,
        tournamentId: '', customTournamentName: '',
      }));
      setUseCustomTournament(false);

      // Discord notification – disabled if function fails
      // try {
      //   await supabase.functions.invoke('discord-match-notification', {
      //     body: {
      //       match_id: null,
      //       team_a_name: isPlayerMatch ? form.playerAInput : form.teamAInput,
      //       team_b_name: isPlayerMatch ? form.playerBInput : form.teamBInput,
      //       score_a: form.scoreA,
      //       score_b: form.scoreB,
      //       reporter_name: user?.display_name || user?.email || 'Anonymous',
      //       is_player_match: isPlayerMatch,
      //       pending_approval: true
      //     }
      //   });
      // } catch (notifyErr) {
      //   console.warn('Discord notification failed:', notifyErr);
      // }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        select, option {
          background-color: #1f2937 !important;
          color: #f3f4f6 !important;
        }
        select:focus, option:focus { outline: none; }
        input, textarea { color-scheme: dark; }
      `}</style>

      <div className="rtr-card max-w-4xl mx-auto animate-fade-in border border-gray-800 bg-gray-900 shadow-xl">
        <div className="mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <i className="fas fa-futbol text-blue-400"></i> Report Match
          </h2>
          <p className="text-gray-400 text-sm">
            Submit game results. They will be reviewed by an admin before affecting rankings.
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
          {/* Match Type Toggle */}
          <div className="flex gap-4 p-2 bg-gray-800/30 rounded-lg">
            <button
              type="button"
              onClick={() => setMatchType('5v5')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                matchType === '5v5'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              5v5 Team Match
            </button>
            <button
              type="button"
              onClick={() => setMatchType('1v1')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                matchType === '1v1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              1v1 Player Match
            </button>
          </div>

          {/* Tournament section */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tournament (optional)</label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={useCustomTournament} onChange={(e) => setUseCustomTournament(e.target.checked)} className="rounded border-gray-600 bg-gray-700 text-blue-500" />
                <span className="text-gray-300">Enter custom tournament</span>
              </label>
            </div>
            {!useCustomTournament ? (
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                value={form.tournamentId}
                onChange={(e) => setForm({...form, tournamentId: e.target.value})}
              >
                <option value="">None (Standalone match)</option>
                {filteredTournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            ) : (
              <input type="text" placeholder="e.g. RTR Cup 2026" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white" value={form.customTournamentName} onChange={(e) => setForm({...form, customTournamentName: e.target.value})} />
            )}
          </div>

          {/* Scoreboard card */}
          <div className="bg-gray-800/20 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-700 bg-gray-800/60">
              <div className="flex items-center justify-center p-3">
                <input type="date" className="bg-transparent text-sm font-medium text-white text-center cursor-pointer" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="flex items-center justify-center p-3">
                <select className="bg-transparent text-sm font-medium text-white text-center w-full cursor-pointer" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
                  {stageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-center p-3">
                <select className="bg-transparent text-sm font-medium text-white text-center cursor-pointer appearance-none" value={form.format} onChange={e => setForm({...form, format: e.target.value})}>
                  <option value="Bo1">Best of 1</option><option value="Bo3">Best of 3</option><option value="Bo5">Best of 5</option><option value="Bo7">Best of 7</option>
                </select>
              </div>
            </div>

            {matchType === '1v1' ? (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-gray-700 gap-4">
                  <div className="w-full sm:w-2/3">
                    <div className="mb-2"><span className="text-blue-400 font-bold text-sm">PLAYER A</span></div>
                    <input list="player-suggestions" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-base text-white" placeholder="Type player name (or enter custom)" value={form.playerAInput} onChange={e => handlePlayerAChange(e.target.value)} autoComplete="off" />
                  </div>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                    <button type="button" onClick={() => handleScoreChange('A', -1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">-</button>
                    <div className="w-14 text-center text-2xl font-bold text-white font-mono">{form.scoreA}</div>
                    <button type="button" onClick={() => handleScoreChange('A', 1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">+</button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
                  <div className="w-full sm:w-2/3">
                    <div className="mb-2"><span className="text-blue-400 font-bold text-sm">PLAYER B</span></div>
                    <input list="player-suggestions" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-base text-white" placeholder="Type player name (or enter custom)" value={form.playerBInput} onChange={e => handlePlayerBChange(e.target.value)} autoComplete="off" />
                  </div>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                    <button type="button" onClick={() => handleScoreChange('B', -1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">-</button>
                    <div className="w-14 text-center text-2xl font-bold text-white font-mono">{form.scoreB}</div>
                    <button type="button" onClick={() => handleScoreChange('B', 1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">+</button>
                  </div>
                </div>
                <datalist id="player-suggestions">
                  {players.map(p => <option key={p.id} value={p.display_name || p.handle} />)}
                </datalist>
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-gray-700 gap-4">
                  <div className="w-full sm:w-2/3">
                    <div className="mb-2"><span className="text-blue-400 font-bold text-sm">TEAM A</span></div>
                    <input list="team-suggestions" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-base text-white" placeholder="Type team name (or enter custom)" value={form.teamAInput} onChange={e => handleTeamAChange(e.target.value)} autoComplete="off" />
                  </div>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                    <button type="button" onClick={() => handleScoreChange('A', -1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">-</button>
                    <div className="w-14 text-center text-2xl font-bold text-white font-mono">{form.scoreA}</div>
                    <button type="button" onClick={() => handleScoreChange('A', 1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">+</button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
                  <div className="w-full sm:w-2/3">
                    <div className="mb-2"><span className="text-blue-400 font-bold text-sm">TEAM B</span></div>
                    <input list="team-suggestions" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-base text-white" placeholder="Type team name (or enter custom)" value={form.teamBInput} onChange={e => handleTeamBChange(e.target.value)} autoComplete="off" />
                  </div>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                    <button type="button" onClick={() => handleScoreChange('B', -1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">-</button>
                    <div className="w-14 text-center text-2xl font-bold text-white font-mono">{form.scoreB}</div>
                    <button type="button" onClick={() => handleScoreChange('B', 1)} className="w-10 h-10 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">+</button>
                  </div>
                </div>
                <datalist id="team-suggestions">
                  {allTeams.map(team => <option key={team.id} value={team.name} />)}
                </datalist>
              </>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-8 py-3 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-check-circle"></i> Submit Match Result</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}