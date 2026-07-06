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
        .eq('approved', true)    // ✅ correct
        .eq('rejected', false)   // ✅ correct
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

  return ( ... ); // same as before
}