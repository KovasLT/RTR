import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RecentMatches({ limit = 5 }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const winProbability = (ratingA, ratingB) => 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      if (!data.length) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Fetch team names separately
      const teamIds = [...new Set(data.flatMap(m => [m.team_a_id, m.team_b_id]))];
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, tag')
        .in('id', teamIds);
      if (teamsError) console.error(teamsError);
      const teamMap = new Map(teams?.map(t => [t.id, t]) || []);

      const enriched = data.map(m => ({
        ...m,
        team_a: teamMap.get(m.team_a_id),
        team_b: teamMap.get(m.team_b_id)
      }));
      setMatches(enriched);
      setLoading(false);
    };
    fetchMatches();
  }, [limit]);

  if (loading) return <div className="text-sm text-gray-400">Loading matches...</div>;
  if (matches.length === 0) return <div className="text-sm text-gray-400">No matches yet.</div>;

  return (
    <div className="space-y-3">
      {matches.map(m => {
        const ratingA = m.team_a_rating_before || 1200;
        const ratingB = m.team_b_rating_before || 1200;
        const winProbA = winProbability(ratingA, ratingB);
        const winProbPercentA = Math.round(winProbA * 100);
        const winProbPercentB = 100 - winProbPercentA;
        const deltaA = (m.team_a_rating_after || 0) - ratingA;
        const deltaB = (m.team_b_rating_after || 0) - ratingB;
        return (
          <div key={m.id} className="border-b border-gray-800 pb-3 last:border-0">
            {m.match_info && (
              <div className="flex justify-center mb-2">
                <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{m.match_info}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <div className="flex-1">
                <Link to={`/team/${m.team_a_id}`} className="text-white hover:text-indigo-300 font-medium">{m.team_a?.name}</Link>
                <div className="text-[10px] text-gray-500">{ratingA}<span className={`ml-1 ${deltaA >= 0 ? 'text-green-400' : 'text-red-400'}`}>{deltaA >= 0 ? `+${deltaA}` : deltaA}</span></div>
              </div>
              <div className="text-center mx-2">
                <div className="text-gray-400 font-mono text-base font-bold">{m.score_team_a} – {m.score_team_b}</div>
                <div className="text-[10px] text-gray-500 whitespace-nowrap">{winProbPercentA}% – {winProbPercentB}%</div>
              </div>
              <div className="flex-1 text-right">
                <Link to={`/team/${m.team_b_id}`} className="text-white hover:text-indigo-300 font-medium">{m.team_b?.name}</Link>
                <div className="text-[10px] text-gray-500">{ratingB}<span className={`ml-1 ${deltaB >= 0 ? 'text-green-400' : 'text-red-400'}`}>{deltaB >= 0 ? `+${deltaB}` : deltaB}</span></div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">{new Date(m.created_at).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}