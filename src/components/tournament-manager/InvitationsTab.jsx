import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function InvitationsTab({ tournamentId, tournamentType }) {
  const [invites, setInvites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, [tournamentId]);

  const fetchInvites = async () => {
    const { data, error } = await supabase
      .from('tournament_invitations')
      .select(`
        *,
        team:teams(id, name, tag),
        player:profiles(id, display_name, handle)
      `)
      .eq('tournament_id', tournamentId);
    if (!error) setInvites(data || []);
  };

  const searchTeams = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, tag')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);
    if (!error) setSearchResults(data);
    setLoading(false);
  };

  const sendInvite = async (teamId) => {
    setSending(true);
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('tournament_invitations')
      .insert({
        tournament_id: tournamentId,
        team_id: teamId,
        message: message || null,
        invited_by: user.user.id,
        status: 'pending'
      });
    if (error) alert(error.message);
    else {
      alert('Invitation sent!');
      setSearchTerm('');
      setMessage('');
      setSearchResults([]);
      fetchInvites();
    }
    setSending(false);
  };

  const updateInviteStatus = async (inviteId, newStatus) => {
    const { error } = await supabase
      .from('tournament_invitations')
      .update({ status: newStatus, updated_at: new Date() })
      .eq('id', inviteId);
    if (error) alert(error.message);
    else fetchInvites();
  };

  return (
    <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 animate-fade-in space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white mb-3"><i className="fas fa-envelope text-indigo-400 mr-2"></i>Send Invitations</h4>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search team by name..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={searchTeams} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded font-bold">Search</button>
        </div>
        <textarea
          placeholder="Optional message to include in invitation"
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white mb-3"
          rows="2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {loading && <p className="text-xs text-gray-500">Searching...</p>}
        {searchResults.length > 0 && (
          <div className="space-y-2 mb-4">
            {searchResults.map(team => (
              <div key={team.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">{team.name}</span>
                  {team.tag && <span className="text-gray-400 text-sm ml-2">[{team.tag}]</span>}
                </div>
                <button
                  onClick={() => sendInvite(team.id)}
                  disabled={sending}
                  className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded"
                >
                  Send Invite
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold text-white mb-3"><i className="fas fa-list text-indigo-400 mr-2"></i>Sent Invitations</h4>
        {invites.length === 0 ? (
          <p className="text-xs text-gray-500">No invitations sent yet.</p>
        ) : (
          <div className="space-y-2">
            {invites.map(inv => (
              <div key={inv.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">{inv.team?.name || inv.player?.display_name}</span>
                  {inv.status === 'pending' && <span className="ml-2 text-yellow-400 text-xs">(pending)</span>}
                  {inv.status === 'accepted' && <span className="ml-2 text-green-400 text-xs">(accepted)</span>}
                  {inv.status === 'rejected' && <span className="ml-2 text-red-400 text-xs">(rejected)</span>}
                  {inv.message && <p className="text-gray-400 text-xs mt-1 italic">"{inv.message}"</p>}
                </div>
                {inv.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateInviteStatus(inv.id, 'accepted')} className="bg-green-700/50 hover:bg-green-700 text-white text-xs px-2 py-1 rounded">Accept</button>
                    <button onClick={() => updateInviteStatus(inv.id, 'rejected')} className="bg-red-700/50 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}