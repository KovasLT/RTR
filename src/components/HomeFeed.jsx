import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function HomeFeed({ limit = 10 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // 1. Recent confirmed matches
        const { data: matches } = await supabase
          .from('matches')
          .select(`
            id, created_at, score_team_a, score_team_b,
            team_a:teams!team_a_id(name, tag),
            team_b:teams!team_b_id(name, tag)
          `)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(limit);

        const matchActivities = (matches || []).map(m => ({
          id: `match-${m.id}`,
          type: 'match',
          timestamp: m.created_at,
          title: 'Match completed',
          description: `${m.team_a?.name || '?'} ${m.score_team_a} – ${m.score_team_b} ${m.team_b?.name || '?'}`,
          link: `/team/${m.team_a_id}`,
        }));

        // 2. Recent team member joins (player signings)
        const { data: joins } = await supabase
          .from('team_members')
          .select(`
            id, joined_at,
            profile:profiles!user_id(display_name, handle),
            team:teams!team_id(name, tag)
          `)
          .order('joined_at', { ascending: false })
          .limit(limit);

        const joinActivities = (joins || []).map(j => ({
          id: `join-${j.id}`,
          type: 'join',
          timestamp: j.joined_at,
          title: 'Player signed',
          description: `${j.profile?.display_name || j.profile?.handle || 'Someone'} joined ${j.team?.name || 'a team'}`,
          link: `/profile/${j.user_id}`,
        }));

        // 3. Recent tournament placements (top 3 finishes) – use tournament end_date
        const { data: placements } = await supabase
          .from('tournament_teams')
          .select(`
            id, placement,
            team:teams!team_id(name, tag),
            tournament:tournaments!tournament_id(title, end_date)
          `)
          .not('placement', 'is', null)
          .order('placement', { ascending: true })
          .limit(limit);

        const placementActivities = (placements || []).map(p => ({
          id: `placement-${p.id}`,
          type: 'placement',
          timestamp: p.tournament?.end_date || new Date().toISOString(),
          title: 'Tournament placement',
          description: `${p.team?.name || 'A team'} finished #${p.placement} in ${p.tournament?.title || 'a tournament'}`,
          link: `/tournaments`,
        }));

        // 4. Recent scrim posts
        const { data: scrims } = await supabase
          .from('scrim_posts')
          .select(`
            id, created_at, message,
            team:teams!team_id(name, tag),
            creator:profiles!created_by(display_name, handle)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limit);

        const scrimActivities = (scrims || []).map(s => ({
          id: `scrim-${s.id}`,
          type: 'scrim',
          timestamp: s.created_at,
          title: 'Looking for scrim',
          description: `${s.team?.name || 'A team'} posted: ${s.message?.slice(0, 60) || ''}`,
          link: `/scrims`,
        }));

        // Combine, sort, take first 'limit'
        const all = [...matchActivities, ...joinActivities, ...placementActivities, ...scrimActivities];
        all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivities(all.slice(0, limit));
      } catch (err) {
        console.error('Error fetching activity feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  if (loading) return <div className="text-sm text-gray-400">Loading feed...</div>;
  if (activities.length === 0) return <div className="text-sm text-gray-400">No recent activity</div>;

  const getIcon = (type) => {
    switch (type) {
      case 'match': return '🏆';
      case 'join': return '➕';
      case 'placement': return '🏅';
      case 'scrim': return '🔍';
      default: return '📌';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="border-b border-gray-800 pb-3 last:border-0">
          <div className="flex items-start gap-2">
            <span className="text-lg">{getIcon(activity.type)}</span>
            <div className="flex-1">
              <div className="flex justify-between items-start flex-wrap gap-1">
                <h4 className="text-white font-medium text-sm">{activity.title}</h4>
                <span className="text-[10px] text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-300 text-sm mt-1">{activity.description}</p>
              <Link
                to={activity.link}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
              >
                View details →
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}