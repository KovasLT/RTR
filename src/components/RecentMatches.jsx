import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const winProbability = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

const formatDateTime = (dateString) => {
  const d = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function RecentMatches({ limit = 3 }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          match_info,
          score_team_a,
          score_team_b,
          team_a_id,
          team_b_id,
          team_a_rating_before,
          team_b_rating_before,
          team_a_rating_after,
          team_b_rating_after,
          team_a:teams!team_a_id(name, tag),
          team_b:teams!team_b_id(name, tag)
        `)
        .eq('approved', true)
        .eq('rejected', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        const processed = data.map(m => {
          const teamA = Array.isArray(m.team_a) ? m.team_a[0] : m.team_a;
          const teamB = Array.isArray(m.team_b) ? m.team_b[0] : m.team_b;
          const teamAName = teamA?.name || 'Unknown';
          const teamBName = teamB?.name || 'Unknown';
          const ratingA = m.team_a_rating_before || 1200;
          const ratingB = m.team_b_rating_before || 1200;
          const winProbPercent = Math.round(winProbability(ratingA, ratingB) * 100);
          const deltaA = (m.team_a_rating_after || 1200) - ratingA;
          const deltaB = (m.team_b_rating_after || 1200) - ratingB;
          
          return {
            id: m.id,
            created_at: m.created_at,
            formatted_date: formatDateTime(m.created_at),
            match_info: m.match_info,
            team_a_name: teamAName,
            team_b_name: teamBName,
            score_a: m.score_team_a,
            score_b: m.score_team_b,
            rating_a: ratingA,
            rating_b: ratingB,
            win_prob_percent: winProbPercent,
            delta_a: deltaA,
            delta_b: deltaB,
          };
        });
        setMatches(processed);
      }
      setLoading(false);
    };
    fetchMatches();
  }, [limit]);

  if (loading) return <div className="text-xs text-gray-400">Loading matches...</div>;
  if (matches.length === 0) return <div className="text-xs text-gray-400">No matches recorded yet.</div>;

  return (
    <div className="space-y-0">
      {matches.map((m, idx) => (
        <div 
          key={m.id} 
          className={`py-3 ${idx !== matches.length - 1 ? 'border-b border-gray-800/60' : ''}`}
        >
          {/* Match Type Pill */}
          <div className="flex justify-center mb-2">
            <span className="bg-[#1e2433] text-gray-300 text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full tracking-wider">
              {m.match_info || 'MATCH'}
            </span>
          </div>

          {/* Main Row */}
          <div className="flex justify-between items-center px-1">
            {/* Team A (Left) */}
            <div className="flex-1">
              <div className="text-white font-semibold text-sm sm:text-base">{m.team_a_name}</div>
              <div className="text-[10px] sm:text-xs mt-0.5">
                <span className="text-gray-500">{m.rating_a}</span>{' '}
                <span className={m.delta_a >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {m.delta_a > 0 ? `+${m.delta_a}` : m.delta_a}
                </span>
              </div>
            </div>

            {/* Score & Prob (Center) */}
            <div className="flex flex-col items-center justify-center w-20 sm:w-24">
              <div className="text-base sm:text-lg font-bold text-gray-300 tracking-widest">
                {m.score_a}–{m.score_b}
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">
                {m.win_prob_percent}–{100 - m.win_prob_percent}%
              </div>
            </div>

            {/* Team B (Right) */}
            <div className="flex-1 text-right">
              <div className="text-white font-semibold text-sm sm:text-base">{m.team_b_name}</div>
              <div className="text-[10px] sm:text-xs mt-0.5">
                <span className="text-gray-500">{m.rating_b}</span>{' '}
                <span className={m.delta_b > 0 ? 'text-green-500' : 'text-red-500'}>
                  {m.delta_b > 0 ? `+${m.delta_b}` : m.delta_b}
                </span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="text-center text-[9px] sm:text-[10px] text-gray-600 mt-2">
            {m.formatted_date}
          </div>
        </div>
      ))}
    </div>
  );
}