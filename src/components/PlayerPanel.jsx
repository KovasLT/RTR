import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMyMemberships } from '../hooks/useTeams.js';
import { useRatingHistory, usePlayerMutations } from '../hooks/useProfiles.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useChat } from './ChatContext';
import { supabase } from '../lib/supabase';
import Sparkline from './Sparkline';

const winProbability = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

const PlayerPanel = ({ profile, rating, userId }) => {
  const { user } = useAuth();
  const { openChatWith } = useChat();
  const p = profile?.player;
  const { data: teams = [] } = useMyMemberships(userId);
  const { data: history = [] } = useRatingHistory('player', userId);
  const { setLookingForTeam } = usePlayerMutations();

  const userTeam = teams[0]; // player can only have one team at a time

  const [recentMatches, setRecentMatches] = useState([]);
  const [tournamentPlacements, setTournamentPlacements] = useState([]);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    const fetchAllMatches = async () => {
      setLoadingExtra(true);
      try {
        // We pass the raw userId because our updated SQL function handles both 1v1s and 5v5 team logic
        const { data: matches, error } = await supabase.rpc('get_user_matches', { p_user_id: userId });
        
        if (error) throw error;
        const allMatches = matches || [];
        setMatchesPlayed(allMatches.length);
        
        let w = 0, l = 0;
        allMatches.forEach(m => {
          if (m.user_score > m.opponent_score) w++;
          else if (m.user_score < m.opponent_score) l++;
        });
        
        setWins(w);
        setLosses(l);
        setRecentMatches(allMatches.slice(0, 4));

        let placements = [];
        if (userTeam) {
          const { data: teamPl } = await supabase
            .from('tournament_teams')
            .select('placement, tournament:tournaments(title)')
            .eq('team_id', userTeam.teamId)
            .not('placement', 'is', null);
          if (teamPl) placements.push(...teamPl);
        }
        const { data: playerPl } = await supabase
          .from('tournament_players')
          .select('placement, tournament:tournaments(title)')
          .eq('player_id', userId)
          .not('placement', 'is', null);
        if (playerPl) placements.push(...playerPl);
        setTournamentPlacements(placements);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExtra(false);
      }
    };
    fetchAllMatches();
  }, [userId, userTeam]);

  const peakRating = history.length ? Math.max(...history.map(h => h.new_rating)) : null;
  const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : null;
  const sparklineData = [...history].map(h => h.new_rating);

  const handleToggleLooking = async () => {
    try {
      await setLookingForTeam.mutateAsync({ userId, value: !p?.looking_for_team });
    } catch (err) {
      alert('Failed to update status. Please try again.');
    }
  };

  const displayName = profile?.display_name || profile?.handle || 'Unknown Player';
  const avatarUrl = profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#1a1f35] to-[#111111] border border-indigo-500/20 rounded-2xl p-6 overflow-hidden shadow-lg">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/50 shadow-md bg-gray-900" />
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-3">
              <h2 className="text-3xl font-bold text-white tracking-tight">{displayName}</h2>
              <div className="inline-block bg-indigo-950/30 border border-indigo-500/30 rounded-full px-3 py-1">
                <span className="text-indigo-300 font-mono font-bold text-sm">Rating: {rating ?? 1200}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-6 text-sm">
              <div className="flex items-center gap-2"><i className="fas fa-map-marker-alt text-gray-500"></i><span className="text-gray-300 font-medium">Region: {profile?.region?.name || profile?.region?.code || '—'}</span></div>
              <div className="flex items-center gap-2"><i className="fas fa-crosshairs text-gray-500"></i><span className="text-gray-300 font-medium">Main: <span className="text-white">{p?.lane?.name || '—'}</span></span></div>
              <div className="flex items-center gap-2"><i className="fas fa-shield-alt text-gray-500"></i><span className="text-gray-300 font-medium">Sec: <span className="text-white">{p?.secondary_lane?.name || '—'}</span></span></div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end justify-center min-w-[140px] gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Recruitment Status</span>
            <button onClick={handleToggleLooking} disabled={setLookingForTeam.isPending} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm border w-full justify-center ${p?.looking_for_team ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
              <i className={`fas ${p?.looking_for_team ? 'fa-search' : 'fa-lock'}`}></i>
              {setLookingForTeam.isPending ? 'Updating...' : (p?.looking_for_team ? 'L.F.T Active' : 'Not Looking')}
            </button>
            {/* Contact Player button – only show if viewing another player */}
            {user?.id !== userId && (
              <button
                onClick={() => openChatWith({ id: userId, display_name: displayName })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white w-full justify-center"
              >
                <i className="fas fa-comment"></i> Contact Player
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151922] border border-gray-800/80 rounded-xl p-4 flex flex-col items-center justify-center"><span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Wins</span><span className="text-3xl font-black text-white">{wins}</span></div>
        <div className="bg-[#151922] border border-gray-800/80 rounded-xl p-4 flex flex-col items-center justify-center"><span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Losses</span><span className="text-3xl font-black text-white">{losses}</span></div>
        <div className="bg-[#151922] border border-gray-800/80 rounded-xl p-4 flex flex-col items-center justify-center"><span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Win Rate</span><span className="text-3xl font-black text-indigo-400">{winRate !== null ? `${winRate}%` : '—'}</span></div>
        <div className="bg-[#151922] border border-gray-800/80 rounded-xl p-4 flex flex-col items-center justify-center"><span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Matches Played</span><span className="text-3xl font-black text-gray-300">{matchesPlayed || '—'}</span></div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Rating Graph Card */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white uppercase tracking-wide"><i className="fas fa-chart-line text-indigo-400 mr-2"></i> Elo Progression</h3>{peakRating && <div className="text-xs bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 px-2.5 py-1 rounded-md font-medium">Peak: <span className="font-mono font-bold">{peakRating}</span></div>}</div>
            {sparklineData.length < 2 ? <div className="h-24 flex items-center justify-center border border-dashed border-gray-800 rounded-lg"><p className="text-sm text-gray-500">Not enough competitive data to plot progression.</p></div> : <div className="bg-[#151922] rounded-lg p-4 border border-gray-800/50"><Sparkline values={sparklineData} width={500} height={80} className="w-full h-20" /></div>}
          </div>

          {/* Recent Matches */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4"><i className="fas fa-history text-indigo-400 mr-2"></i> Recent Matches</h3>
            {loadingExtra ? <div className="py-8 text-center text-gray-500 text-sm">Loading match history...</div> : recentMatches.length === 0 ? <div className="py-8 text-center border border-dashed border-gray-800 rounded-lg text-gray-500 text-sm">No recent matches recorded.</div> : <div className="space-y-3">
              {recentMatches.map(m => {
                const userRatingBefore = m.rating_before || 1200;
                const oppRatingBefore = m.opponent_score !== undefined ? (m.opponent_score > 0 ? m.rating_before : 1200) : 1200;
                const delta = (m.rating_after || 1200) - userRatingBefore;
                const isWin = m.user_score > m.opponent_score;
                const isDraw = m.user_score === m.opponent_score;
                const winProbPercent = Math.round(winProbability(userRatingBefore, oppRatingBefore) * 100);
                
                return (
                  <div key={m.match_id} className="group bg-[#151922] hover:bg-[#1a1f2e] border border-gray-800 hover:border-gray-700 rounded-lg p-3 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isWin ? 'bg-green-950/50 text-green-400 border border-green-900/50' : isDraw ? 'bg-yellow-950/50 text-yellow-400 border border-yellow-900/50' : 'bg-red-950/50 text-red-400 border border-red-900/50'}`}>{isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}</span>
                        <span className="text-[10px] text-gray-500 uppercase">{m.match_type === 'player' ? '1v1' : '5v5'}</span>
                        {m.match_info && <span className="text-[10px] text-gray-500 uppercase">{m.match_info}</span>}
                      </div>
                      <div className="text-white font-medium truncate">vs {m.opponent_name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center justify-center px-4 border-l border-r border-gray-800/50">
                      <div className="text-xl font-mono font-black text-white tracking-widest">{m.user_score} – {m.opponent_score}</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">{winProbPercent}% Prob.</div>
                    </div>
                    <div className="w-20 text-right flex flex-col items-end justify-center">
                      <div className={`text-lg font-mono font-bold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>{delta >= 0 ? `+${delta}` : delta}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Elo Shift</div>
                    </div>
                  </div>
                );
              })}
            </div>}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Card */}
          <div className="bg-gradient-to-b from-[#151922] to-[#111111] border border-gray-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4"><i className="fas fa-users text-indigo-400 mr-2"></i> Active Roster</h3>
            {!userTeam ? <div className="text-center py-4"><div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-800"><i className="fas fa-ghost text-gray-600"></i></div><p className="text-xs text-gray-400 mb-3">Operating as a Free Agent.</p><Link to="/teams" className="inline-block text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">Find a Team</Link></div> : <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3"><div><Link to={`/team/${userTeam.teamId}`} className="text-lg font-bold text-white hover:text-indigo-300 transition-colors">{userTeam.name}</Link>{userTeam.tag && <span className="ml-2 text-xs font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">[{userTeam.tag}]</span>}</div><div className="text-right"><span className="block text-indigo-400 font-mono font-bold">{userTeam.rating}</span><span className="text-[9px] text-gray-500 uppercase tracking-widest">Team Elo</span></div></div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">{userTeam.regionCode && <span className="bg-slate-900/50 text-slate-400 border border-slate-700/50 text-[10px] px-2 py-0.5 rounded font-bold">{userTeam.regionCode}</span>}{userTeam.isCaptain && <span className="bg-amber-950/30 text-amber-400 border border-amber-900/30 text-[10px] px-2 py-0.5 rounded font-bold"><i className="fas fa-crown mr-1"></i> Captain</span>}</div>
            </div>}
          </div>

          {/* Tournament Achievements */}
          {!loadingExtra && tournamentPlacements.length > 0 && (
            <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4"><i className="fas fa-medal text-amber-400 mr-2"></i> Hardware</h3>
              <div className="flex flex-col gap-2">
                {tournamentPlacements.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#151922] border border-gray-800/80 p-2.5 rounded-lg">
                    <div className="text-lg drop-shadow-md">{p.placement === 1 ? '🥇' : p.placement === 2 ? '🥈' : p.placement === 3 ? '🥉' : '🏅'}</div>
                    <div className="flex-1 min-w-0"><div className="text-xs text-gray-300 font-medium truncate" title={p.tournament?.title}>{p.tournament?.title}</div></div>
                    <div className="text-xs font-mono font-bold text-gray-500 bg-black/40 px-2 py-1 rounded">#{p.placement}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Log */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4"><i className="fas fa-list-ul text-indigo-400 mr-2"></i> Event Log</h3>
            {history.length === 0 ? <p className="text-xs text-gray-500 italic text-center py-2">No rating events registered.</p> : <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-gray-800">
              {history.slice(0, 5).reverse().map((e, i) => (
                <div key={i} className="relative flex items-start gap-3 pl-6">
                  <div className={`absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full ${e.delta > 0 ? 'bg-green-500' : e.delta < 0 ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                  <div className="flex-1 min-w-0"><div className="text-xs text-gray-300 capitalize truncate">{e.reason?.replace(/_/g, ' ') || 'Rating adjusted'}</div><div className="text-[10px] text-gray-600 mt-0.5">{new Date(e.created_at).toLocaleDateString()}</div></div>
                  <div className={`text-xs font-mono font-bold ${e.delta > 0 ? 'text-green-400' : e.delta < 0 ? 'text-red-400' : 'text-gray-500'}`}>{e.delta > 0 ? `+${e.delta}` : e.delta}</div>
                </div>
              ))}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPanel;