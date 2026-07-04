import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RecentScrims({ limit = 5 }) {
  const [scrims, setScrims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScrims = async () => {
      const { data, error } = await supabase
        .from('scrim_posts')
        .select(`
          id, created_at, message, team_id, preferred_date, start_time, end_time, format,
          team:teams!team_id(name, tag)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false }); // we'll reorder later
      if (!error) setScrims(data || []);
      setLoading(false);
    };
    fetchScrims();
  }, []);

  // Sort scrims by soonest preferred date and start time
  const sortedScrims = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Helper to get timestamp for comparison
    const getScrimTimestamp = (scrim) => {
      if (!scrim.preferred_date) return new Date(8640000000000000); // far future
      const dateStr = scrim.preferred_date;
      const timeStr = scrim.start_time || '00:00';
      return new Date(`${dateStr}T${timeStr}:00`).getTime();
    };
    
    // Filter out scrims that are already past? Or show them but put at bottom? We'll show all but sort upcoming first.
    const sorted = [...scrims].sort((a, b) => {
      const timeA = getScrimTimestamp(a);
      const timeB = getScrimTimestamp(b);
      const nowTime = now.getTime();
      const aIsPast = timeA < nowTime;
      const bIsPast = timeB < nowTime;
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      return timeA - timeB;
    });
    return sorted.slice(0, limit);
  }, [scrims, limit]);

  if (loading) return <div className="text-sm text-gray-400">Loading scrims...</div>;
  if (sortedScrims.length === 0) return <div className="text-sm text-gray-400">No scrim posts yet.</div>;

  const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : 'TBD';
  
  return (
    <div className="space-y-3">
      {sortedScrims.map(s => {
        const isPast = s.preferred_date && new Date(`${s.preferred_date}T${s.start_time || '00:00'}:00`) < new Date();
        const isToday = s.preferred_date === new Date().toISOString().split('T')[0];
        return (
          <div key={s.id} className="border-b border-gray-800 pb-2 last:border-0">
            <div className="flex justify-between items-start">
              <div className="text-sm">
                <Link to={`/team/${s.team_id}`} className="text-white font-medium hover:text-indigo-300">
                  {s.team?.name}
                </Link>
                <span className="text-gray-400"> is looking for a scrim</span>
              </div>
              {s.format && <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{s.format}</span>}
            </div>
            {s.preferred_date && (
              <div className="text-xs text-gray-400 mt-1">
                📅 {new Date(s.preferred_date).toLocaleDateString()} 
                {s.start_time && s.end_time && (
                  <span> ⏰ {formatTime(s.start_time)} – {formatTime(s.end_time)} UTC</span>
                )}
                {isToday && <span className="ml-2 text-green-400">(Today)</span>}
                {isPast && <span className="ml-2 text-red-400">(Past)</span>}
              </div>
            )}
            {s.message && <div className="text-xs text-gray-300 mt-1">{s.message.slice(0, 80)}</div>}
            <div className="text-xs text-gray-500 mt-1">Posted: {new Date(s.created_at).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}