import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase';
import { useMyMemberships } from '../hooks/useTeams.js';

export default function FindScrims() {
  const { user } = useAuth();
  const { data: myTeams = [] } = useMyMemberships(user?.id);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    team_id: '',
    message: '',
    preferred_date: '',
    start_time_local: '18:00',
    end_time_local: '20:00',
    format: 'Bo3',
    contact_discord: '',
    min_elo: '',
    max_elo: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Convert local date+time to UTC time string (HH:MM)
  const localToUtcTime = (dateStr, localTimeStr) => {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = localTimeStr.split(':');
    const localDate = new Date(year, month - 1, day, hours, minutes);
    const utcHours = localDate.getUTCHours();
    const utcMinutes = localDate.getUTCMinutes();
    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
  };

  // Convert UTC time to local time string (HH:MM) for a given date
  const utcToLocalTime = (dateStr, utcTimeStr) => {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = utcTimeStr.split(':');
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get local date from UTC time (handles day shift)
  const utcToLocalDate = (dateStr, utcTimeStr) => {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = utcTimeStr.split(':');
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return utcDate.toLocaleDateString();
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scrim_posts')
      .select(`
        *,
        team:teams(id, name, tag),
        creator:profiles(id, display_name, handle)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    if (!form.team_id) {
      setError('Please select a team');
      setSubmitLoading(false);
      return;
    }
    if (!form.preferred_date) {
      setError('Please select a date');
      setSubmitLoading(false);
      return;
    }

    const startUtc = localToUtcTime(form.preferred_date, form.start_time_local);
    const endUtc = localToUtcTime(form.preferred_date, form.end_time_local);

    if (startUtc >= endUtc) {
      setError('End time must be after start time');
      setSubmitLoading(false);
      return;
    }

    const payload = {
      team_id: form.team_id,
      created_by: user.id,
      message: form.message || null,
      preferred_date: form.preferred_date,
      start_time: startUtc,
      end_time: endUtc,
      format: form.format,
      contact_discord: form.contact_discord || null,
      min_elo: form.min_elo ? parseInt(form.min_elo) : null,
      max_elo: form.max_elo ? parseInt(form.max_elo) : null,
      status: 'active'
    };

    const { error } = await supabase.from('scrim_posts').insert([payload]);
    if (error) {
      setError(error.message);
    } else {
      setShowForm(false);
      setForm({
        team_id: '',
        message: '',
        preferred_date: '',
        start_time_local: '18:00',
        end_time_local: '20:00',
        format: 'Bo3',
        contact_discord: '',
        min_elo: '',
        max_elo: ''
      });
      fetchPosts();
    }
    setSubmitLoading(false);
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this scrim post?')) return;
    const { error } = await supabase
      .from('scrim_posts')
      .delete()
      .eq('id', postId);
    if (!error) fetchPosts();
  };

  const displayTimeRange = (post) => {
    if (!post.start_time || !post.end_time || !post.preferred_date) return '';
    const localStart = utcToLocalTime(post.preferred_date, post.start_time);
    const localEnd = utcToLocalTime(post.preferred_date, post.end_time);
    const localStartDate = utcToLocalDate(post.preferred_date, post.start_time);
    const localEndDate = utcToLocalDate(post.preferred_date, post.end_time);

    if (localStartDate === localEndDate) {
      return `${localStartDate} ${localStart} – ${localEnd}`;
    } else {
      return `${localStartDate} ${localStart} – ${localEndDate} ${localEnd}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Find Scrims</h2>
          <p className="text-gray-400 text-sm">Post or browse scrim opportunities</p>
        </div>
        {myTeams.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {showForm ? 'Cancel' : '+ Post Scrim'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rtr-card">
          <h3 className="text-white font-semibold mb-4">Create Scrim Post</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
              <select
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                value={form.team_id}
                onChange={e => setForm({ ...form, team_id: e.target.value })}
              >
                <option value="">Select your team</option>
                {myTeams.map(team => (
                  <option key={team.teamId} value={team.teamId}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={form.preferred_date}
                  onChange={e => setForm({ ...form, preferred_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Format</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={form.format}
                  onChange={e => setForm({ ...form, format: e.target.value })}
                >
                  <option>Bo1</option><option>Bo3</option><option>Bo5</option><option>Any</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time (your local time)</label>
                <input
                  type="time"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={form.start_time_local}
                  onChange={e => setForm({ ...form, start_time_local: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Time (your local time)</label>
                <input
                  type="time"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={form.end_time_local}
                  onChange={e => setForm({ ...form, end_time_local: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Min Elo (optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 1000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={form.min_elo}
                  onChange={e => setForm({ ...form, min_elo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Max Elo (optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 2000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  value={form.max_elo}
                  onChange={e => setForm({ ...form, max_elo: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contact (Discord)</label>
              <input
                type="text"
                placeholder="Discord username or server invite"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                value={form.contact_discord}
                onChange={e => setForm({ ...form, contact_discord: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Additional Message</label>
              <textarea
                rows="2"
                placeholder="Any extra info..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition"
            >
              {submitLoading ? 'Posting...' : 'Post Scrim'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="rtr-card text-center py-10">
          <p className="text-gray-400">No active scrim posts. Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="rtr-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {post.team?.name} {post.team?.tag ? `[${post.team.tag}]` : ''}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Posted by {post.creator?.display_name || post.creator?.handle || 'Someone'} • {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
                {post.created_by === user?.id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><span className="text-gray-500">Format:</span> {post.format}</div>
                {(post.start_time || post.end_time) && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Time slot:</span> {displayTimeRange(post)}
                  </div>
                )}
                {(post.min_elo || post.max_elo) && (
                  <div><span className="text-gray-500">Elo range:</span> {post.min_elo || '?'} – {post.max_elo || '?'}</div>
                )}
                {post.contact_discord && (
                  <div><span className="text-gray-500">Contact:</span> {post.contact_discord}</div>
                )}
              </div>
              {post.message && (
                <div className="mt-3 text-gray-300 border-t border-gray-800 pt-2 text-sm">
                  {post.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}