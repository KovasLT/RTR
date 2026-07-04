import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TeamTournamentInvites({ teamId }) {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teamId) return;
        fetchInvites();
    }, [teamId]);

    const fetchInvites = async () => {
        setLoading(true);
        const { data, error } = await supabase
        .from('tournament_invitations')
        .select(`
        *,
        tournament:tournaments(id, title, format, start_date)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending');
        if (!error) setInvites(data || []);
        setLoading(false);
    };

    const handleResponse = async (inviteId, newStatus) => {
        const { error } = await supabase
        .from('tournament_invitations')
        .update({ status: newStatus })
        .eq('id', inviteId);
        if (error) alert(error.message);
        else {
            alert(`Invitation ${newStatus === 'accepted' ? 'accepted' : 'declined'}`);
            fetchInvites(); // refresh
        }
    };

    if (loading) return <div className="text-xs text-gray-500">Loading invitations...</div>;
    if (invites.length === 0) return null;

    return (
        <div className="mt-6 p-4 bg-[#151922] rounded-xl border border-gray-800">
        <h3 className="text-sm font-bold text-white mb-3">🏆 Tournament Invitations</h3>
        <div className="space-y-2">
        {invites.map(inv => (
            <div key={inv.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
            <div>
            <div className="text-white font-medium">{inv.tournament?.title}</div>
            <div className="text-gray-400 text-xs">
            {inv.tournament?.format?.replace('_', ' ')} · Starts {inv.tournament?.start_date}
            </div>
            {inv.message && <div className="text-indigo-300 text-xs mt-1 italic">"{inv.message}"</div>}
            </div>
            <div className="flex gap-2">
            <button onClick={() => handleResponse(inv.id, 'accepted')} className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded">Accept</button>
            <button onClick={() => handleResponse(inv.id, 'rejected')} className="bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Decline</button>
            </div>
            </div>
        ))}
        </div>
        </div>
    );
}
