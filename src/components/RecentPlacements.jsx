import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function RecentPlacements({ limit = 10 }) {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlacements = async () => {
      setLoading(true);
      try {
        // 1. Fetch all tournament_teams that have a placement
        const { data: teamLinks, error: linksError } = await supabase
          .from('tournament_teams')
          .select('team_id, placement, tournament_id')
          .not('placement', 'is', null)
          .order('tournament_id', { ascending: false })
          .limit(limit);
        if (linksError) throw linksError;

        if (!teamLinks.length) {
          setPlacements([]);
          setLoading(false);
          return;
        }

        const teamIds = [...new Set(teamLinks.map(tl => tl.team_id))];
        const tournamentIds = [...new Set(teamLinks.map(tl => tl.tournament_id))];

        // 2. Fetch team details
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, tag')
          .in('id', teamIds);
        if (teamsError) throw teamsError;

        // 3. Fetch tournament details
        const { data: tournaments, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('id, title, end_date')
          .in('id', tournamentIds);
        if (tournamentsError) throw tournamentsError;

        const teamMap = new Map(teams?.map(t => [t.id, t]) || []);
        const tournamentMap = new Map(tournaments?.map(t => [t.id, t]) || []);

        const result = teamLinks.map(tl => ({
          ...tl,
          team: teamMap.get(tl.team_id),
          tournament: tournamentMap.get(tl.tournament_id)
        }));
        result.sort((a, b) => a.placement - b.placement);
        setPlacements(result);
      } catch (err) {
        console.error('Error fetching placements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlacements();
  }, [limit]);

  if (loading) return <div className="text-sm text-gray-400">Loading placements...</div>;
  if (placements.length === 0) return <div className="text-sm text-gray-400">No tournament placements yet.</div>;

  const getMedal = (placement) => {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    return `#${placement}`;
  };

  return (
    <div className="space-y-3">
      {placements.map(p => (
        <div key={p.team_id} className="border-b border-gray-800 pb-2 last:border-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{getMedal(p.placement)}</span>
            <div>
              <Link to={`/team/${p.team_id}`} className="text-white hover:text-indigo-300">
                {p.team?.name}
              </Link>
              <span className="text-gray-400"> placed </span>
              <Link to="/tournaments" className="text-gray-300 hover:text-indigo-300">
                {p.tournament?.title}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}