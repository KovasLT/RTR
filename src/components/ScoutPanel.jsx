import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyWatchlist, useScoutMutations } from '../hooks/useScouting.js';
import { useDirectory } from '../hooks/useProfiles.js';
import { useLanes, useRanks, useRegions } from '../hooks/useReferenceData.js';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Sparkline from '../components/Sparkline';
import RatingBadge from '../components/RatingBadge';
import { APP_CONSTANTS } from '../app-constants';

const D = APP_CONSTANTS.DASHBOARD;
const ALL = 'ALL';

const ScoutPanel = ({ rating, userId }) => {
  // Watchlist from hook (includes refetch function)
  const { data: watchlist = [], refetch: refetchWatchlist } = useMyWatchlist(userId);
  const { watch, unwatch } = useScoutMutations();
  const { data: directory = [] } = useDirectory();
  const { data: lanes = [] } = useLanes();
  const { data: ranks = [] } = useRanks();
  const { data: regions = [] } = useRegions();

  // Search / filter state
  const [search, setSearch] = useState('');
  const [laneFilter, setLaneFilter] = useState(ALL);
  const [rankFilter, setRankFilter] = useState(ALL);
  const [regionFilter, setRegionFilter] = useState(ALL);
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [lookingForTeam, setLookingForTeam] = useState('ALL'); // 'ALL', 'yes', 'no'

  // Modal state
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerMatches, setPlayerMatches] = useState([]);
  const [playerRatingHistory, setPlayerRatingHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Existing watched player IDs
  const existingWatchIds = new Set(watchlist.map(w => w.playerId));

  // Players available for watching (exclude self and already watched)
  const searchablePlayers = directory.filter(p =>
    p.roles?.includes('player') &&
    p.id !== userId &&
    !existingWatchIds.has(p.id)
  );

  // Apply filters
  const filteredResults = useMemo(() => {
    let results = searchablePlayers;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p => (p.display_name || p.handle || '').toLowerCase().includes(q));
    }
    if (laneFilter !== ALL) {
      results = results.filter(p => p.player?.lane?.name === laneFilter);
    }
    if (rankFilter !== ALL) {
      results = results.filter(p => p.player?.rank?.name === rankFilter);
    }
    if (regionFilter !== ALL) {
      results = results.filter(p => p.region?.code === regionFilter);
    }
    if (minRating) {
      const min = parseInt(minRating);
      if (!isNaN(min)) results = results.filter(p => (p.playerRating || 1200) >= min);
    }
    if (maxRating) {
      const max = parseInt(maxRating);
      if (!isNaN(max)) results = results.filter(p => (p.playerRating || 1200) <= max);
    }
    if (lookingForTeam === 'yes') {
      results = results.filter(p => p.player?.looking_for_team === true);
    } else if (lookingForTeam === 'no') {
      results = results.filter(p => p.player?.looking_for_team === false);
    }
    return results.slice(0, 20);
  }, [searchablePlayers, search, laneFilter, rankFilter, regionFilter, minRating, maxRating, lookingForTeam]);

  // Fetch player details (matches and rating history)
  const fetchPlayerDetails = async (playerId) => {
    setLoadingDetails(true);
    try {
      // Get player's matches via RPC (if available) or fallback to team matches
      let matchesData = [];
      const { data: matches, error: matchesError } = await supabase.rpc('get_player_matches', { p_player_id: playerId });
      if (!matchesError && matches) {
        matchesData = matches;
      } else {
        // Fallback: get player's current team and its matches
        const { data: memberships } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', playerId)
          .is('left_at', null)
          .maybeSingle();
        if (memberships) {
          const { data: teamMatches } = await supabase
            .from('matches')
            .select(`
              id, created_at, match_info, score_team_a, score_team_b,
              team_a:teams!team_a_id(name, tag),
              team_b:teams!team_b_id(name, tag)
            `)
            .or(`team_a_id.eq.${memberships.team_id},team_b_id.eq.${memberships.team_id}`)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })
            .limit(5);
          matchesData = teamMatches || [];
        }
      }
      setPlayerMatches(matchesData.slice(0, 5));

      // Get rating history
      const { data: ratingHistory } = await supabase
        .from('rating_events')
        .select('new_rating, created_at')
        .eq('subject_id', playerId)
        .eq('subject_type', 'player')
        .order('created_at', { ascending: true });
      setPlayerRatingHistory(ratingHistory || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle watch with refetch
  const handleWatch = (playerId) => {
    watch.mutate({ scoutId: userId, playerId }, {
      onSuccess: () => {
        refetchWatchlist();
      }
    });
  };

  // Handle unwatch with refetch
  const handleUnwatch = (playerId) => {
    unwatch.mutate({ scoutId: userId, playerId }, {
      onSuccess: () => {
        refetchWatchlist();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Watchlist Section */}
      <div className="rtr-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="fas fa-eye text-indigo-300"></i> Watchlist
          </h3>
          <RatingBadge value={rating} />
        </div>
        {watchlist.length === 0 ? (
          <p className="text-sm text-gray-400">No players watched yet. Use the search below to add players.</p>
        ) : (
          <div className="space-y-3">
            {watchlist.map(w => (
              <div key={w.id} className="border-b border-gray-800 pb-2 last:border-0">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="flex-1">
                    <Link to={`/player/${w.playerId}`} className="text-white font-medium hover:text-indigo-300">
                      {w.name}
                    </Link>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                      <span>Lane: {w.lane || '—'}</span>
                      <span>Rank: {w.rank || '—'}</span>
                      <span>Team: {w.team || '—'}</span>
                      <span>Rating: {w.rating}</span>
                      {w.lookingForTeam && <span className="text-green-400">LFT</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPlayer(w);
                        fetchPlayerDetails(w.playerId);
                      }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleUnwatch(w.playerId)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Search Section */}
      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-3">Search Players</h3>
        <div className="space-y-3">
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <select className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" value={laneFilter} onChange={e => setLaneFilter(e.target.value)}>
              <option value={ALL}>Lane: All</option>
              {lanes.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
            <select className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" value={rankFilter} onChange={e => setRankFilter(e.target.value)}>
              <option value={ALL}>Rank: All</option>
              {ranks.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
            <select className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value={ALL}>Region: All</option>
              {regions.map(r => <option key={r.id} value={r.code}>{r.code}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Min rating"
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              value={minRating}
              onChange={e => setMinRating(e.target.value)}
            />
            <input
              type="number"
              placeholder="Max rating"
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              value={maxRating}
              onChange={e => setMaxRating(e.target.value)}
            />
            <select className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" value={lookingForTeam} onChange={e => setLookingForTeam(e.target.value)}>
              <option value="ALL">Looking for team: Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {filteredResults.length === 0 ? (
            <p className="text-sm text-gray-500">No players found.</p>
          ) : (
            filteredResults.map(p => {
              const playerRating = p.playerRating || 1200;
              return (
                <div key={p.id} className="flex flex-wrap justify-between items-center border-b border-gray-800 pb-2">
                  <div className="flex-1">
                    <Link to={`/player/${p.id}`} className="text-white font-medium hover:text-indigo-300">
                      {p.display_name || p.handle}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {p.player?.lane?.name || '—'} • {p.player?.rank?.name || '—'} • Rating: {playerRating}
                      {p.player?.looking_for_team && <span className="ml-2 text-green-400">LFT</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleWatch(p.id)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded"
                  >
                    Watch
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Player Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{selectedPlayer.name}</h3>
              <button onClick={() => setSelectedPlayer(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Lane:</span> {selectedPlayer.lane || '—'}</div>
                <div><span className="text-gray-500">Rank:</span> {selectedPlayer.rank || '—'}</div>
                <div><span className="text-gray-500">Team:</span> {selectedPlayer.team || '—'}</div>
                <div><span className="text-gray-500">Rating:</span> {selectedPlayer.rating}</div>
                <div className="col-span-2"><span className="text-gray-500">Looking for team:</span> {selectedPlayer.lookingForTeam ? 'Yes' : 'No'}</div>
              </div>
              {loadingDetails ? (
                <LoadingSpinner />
              ) : (
                <>
                  {playerRatingHistory.length > 1 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Rating History</h4>
                      <Sparkline values={playerRatingHistory.map(h => h.new_rating)} width={400} height={50} className="w-full h-12" />
                    </div>
                  )}
                  {playerMatches.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Recent Matches</h4>
                      <div className="space-y-1">
                        {playerMatches.map(m => {
                          const teamAName = m.team_a?.name || '?';
                          const teamBName = m.team_b?.name || '?';
                          return (
                            <div key={m.id} className="text-xs flex justify-between">
                              <span>{teamAName} vs {teamBName}</span>
                              <span className="text-gray-500">{new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoutPanel;