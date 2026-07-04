import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const RecentSignings = ({ limit = 10 }) => {
  const [signings, setSignings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignings = async () => {
      setLoading(true);
      
      // FIX 1: Removed 'id' (doesn't exist on this table)
      // FIX 2: Removed custom aliases (profile:profiles -> just profiles)
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          joined_at, 
          user_id, 
          team_id,
          profiles(display_name, handle),
          teams(name, tag)
        `)
        .order('joined_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent signings:', error);
      } else if (data) {
        // Map the real table names to the properties our component expects
        const formattedData = data.map(item => ({
          ...item,
          profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          team: Array.isArray(item.teams) ? item.teams[0] : item.teams
        }));
        setSignings(formattedData);
      }
      setLoading(false);
    };

    fetchSignings();
  }, [limit]);

  if (loading) return <p className="text-sm text-gray-500">Loading signings...</p>;
  if (signings.length === 0) return <p className="text-sm text-gray-500">No recent signings found.</p>;

  return (
    <div className="space-y-3">
      {signings.map((s) => (
        // Using composite key (user_id + team_id) since there is no single 'id' column
        <div key={`${s.user_id}-${s.team_id}`} className="flex items-center gap-3 text-sm border-b border-gray-800 pb-2 last:border-0">
          <div className="flex-grow">
            <Link to={`/profile/${s.user_id}`} className="font-medium text-white hover:text-indigo-300">
              {s.profile?.display_name || s.profile?.handle || 'Unknown Player'}
            </Link>
            <span className="text-gray-500 mx-2">joined</span>
            <Link to={`/team/${s.team_id}`} className="font-medium text-indigo-300 hover:text-indigo-200">
              {s.team?.name || 'Unknown Team'} {s.team?.tag ? `[${s.team.tag}]` : ''}
            </Link>
          </div>
          <span className="text-xs text-gray-600">
            {new Date(s.joined_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RecentSignings;