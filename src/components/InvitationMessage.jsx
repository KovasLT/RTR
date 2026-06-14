import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function InvitationMessage({ message, invitationId, actionData, onComplete }) {
  const [status, setStatus] = useState(null);

  const handleAccept = async () => {
    if (status) return;
    setStatus('processing');
    try {
      const { error } = await supabase
        .from('tournament_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
      if (error) throw error;
      await supabase.from('tournament_teams').insert({
        tournament_id: actionData.tournament_id,
        team_id: actionData.team_id
      });
      setStatus('accepted');
      await supabase.from('messages').update({ is_read: true }).eq('id', message.id);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleDecline = async () => {
    if (status) return;
    setStatus('processing');
    try {
      await supabase.from('tournament_invitations').update({ status: 'rejected' }).eq('id', invitationId);
      setStatus('declined');
      await supabase.from('messages').update({ is_read: true }).eq('id', message.id);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="bg-gray-800/70 rounded-lg p-3 max-w-[90%] text-center border border-gray-700">
      <div className="text-gray-300 text-sm whitespace-pre-line">{message.message}</div>
      {status === 'accepted' && <div className="text-green-400 text-sm mt-2">✓ Invitation accepted</div>}
      {status === 'declined' && <div className="text-red-400 text-sm mt-2">✗ Invitation declined</div>}
      {status === 'error' && <div className="text-red-400 text-sm mt-2">Error, please try again</div>}
      {!status && (
        <div className="flex gap-3 justify-center mt-3">
          <button onClick={handleAccept} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded">Accept</button>
          <button onClick={handleDecline} className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 rounded">Decline</button>
        </div>
      )}
      {status === 'processing' && <div className="text-gray-400 text-sm mt-2">Processing...</div>}
    </div>
  );
}