import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RecentSignings({ limit = 5 }) {
  const [signings, setSignings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignings = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id, joined_at, user_id,
          profile:profiles!user_id(display_name, handle),
          team:teams!team_id(name, tag)
        `)
        .order('joined_at', { ascending: false })
        .limit(limit);
      if (!error) setSignings(data || []);
      setLoading(false);
    };
    fetchSignings();
  }, [limit]);

  if (loading) return <div className="text-sm text-gray-400">Loading signings...</div>;
  if (signings.length === 0) return <div className="text-sm text-gray-400">No recent signings.</div>;

  return (
    <div className="space-y-3">
      {signings.map(s => (
        <div key={s.id} className="border-b border-gray-800 pb-2 last:border-0">
          <div className="text-sm">
            <Link to={`/profile/${s.user_id}`} className="text-white hover:text-indigo-300">
              {s.profile?.display_name || s.profile?.handle}
            </Link>
            <span className="text-gray-400"> joined </span>
            <Link to={`/team/${s.team_id}`} className="text-white hover:text-indigo-300">
              {s.team?.name}
            </Link>
          </div>
          <div className="text-xs text-gray-500 mt-1">{new Date(s.joined_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}