import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RecentPlacements({ limit = 5 }) {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlacements = async () => {
      const { data, error } = await supabase
        .from('tournament_teams')
        .select(`
          id, placement, team_id,
          team:teams!team_id(name, tag),
          tournament:tournaments!tournament_id(title, end_date)
        `)
        .not('placement', 'is', null)
        .order('tournament(end_date)', { ascending: false, nullsLast: true })
        .limit(limit);
      if (!error) setPlacements(data || []);
      setLoading(false);
    };
    fetchPlacements();
  }, [limit]);

  if (loading) return <div className="text-sm text-gray-400">Loading placements...</div>;
  if (placements.length === 0) return <div className="text-sm text-gray-400">No tournament placements yet.</div>;

  const medal = (placement) => {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    return `#${placement}`;
  };

  return (
    <div className="space-y-3">
      {placements.map(p => (
        <div key={p.id} className="border-b border-gray-800 pb-2 last:border-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{medal(p.placement)}</span>
            <div>
              <Link to={`/team/${p.team_id}`} className="text-white hover:text-indigo-300">
                {p.team?.name}
              </Link>
              <span className="text-gray-400"> placed in </span>
              <Link to="/tournaments" className="text-gray-300 hover:text-indigo-300">
                {p.tournament?.title || 'a tournament'}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}