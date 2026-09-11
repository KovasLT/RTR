import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../app-constants';

const inputClass =
  'w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500';

const TradeRequestModal = ({ team, player, onClose, onSubmit, isPending }) => {
  const TR = APP_CONSTANTS.TRADES;
  const [targetTeamId, setTargetTeamId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['trade-target-teams', team.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, tag')
        .neq('id', team.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!targetTeamId) {
      setError('Select a destination team.');
      return;
    }
    try {
      await onSubmit({
        targetTeamId,                // uuid string — do not Number() it
        message: message.trim() || null,
      });
    } catch (err) {
      setError(err.message || 'Failed to send trade request.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-700 bg-[#13192b] shadow-2xl p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">{TR.PROPOSE_TITLE}</h3>
        <p className="text-sm text-gray-400 mt-2">
          Offer{' '}
          <span className="text-white font-medium">
            {player?.profile?.display_name || player?.profile?.handle}
          </span>{' '}
          to another team. No rating is deducted — the player simply changes rosters on
          acceptance.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              {TR.DESTINATION}
            </label>
            {isLoading ? (
              <div className="text-xs text-gray-500">Loading teams…</div>
            ) : (
              <select
                className={inputClass}
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
              >
                <option value="">-- Select a team --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.tag ? ` [${t.tag}]` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              {TR.MESSAGE}
            </label>
            <textarea
              rows={3}
              className={inputClass}
              placeholder={TR.MESSAGE_PLACEHOLDER}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50"
            >
              {TR.CANCEL}
            </button>
            <button
              type="submit"
              disabled={isPending || !targetTeamId}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? TR.SENDING : TR.SEND}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeRequestModal;