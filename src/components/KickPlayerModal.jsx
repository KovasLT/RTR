import { useState } from 'react';
import { APP_CONSTANTS } from '../app-constants';

const CONFIRM_WORD = 'KICK';

const KickPlayerModal = ({ player, onClose, onConfirm, isPending }) => {
  const K = APP_CONSTANTS.KICK;
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);

  const canSubmit =
    reason.trim().length >= 10 &&
    confirmText === CONFIRM_WORD &&
    !isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (reason.trim().length < 10) {
      setError('Please provide a reason (at least 10 characters).');
      return;
    }
    if (confirmText !== CONFIRM_WORD) {
      setError(`Type "${CONFIRM_WORD}" to confirm.`);
      return;
    }
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err.message || 'Failed to remove player.');
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
        <h3 className="text-lg font-semibold text-white">{K.TITLE}</h3>
        <p className="text-sm text-gray-400 mt-2">
          You are about to remove{' '}
          <span className="text-white font-medium">
            {player?.profile?.display_name || player?.profile?.handle || 'this player'}
          </span>{' '}
          from the roster.
        </p>
        <p className="text-xs text-red-400 mt-1">{K.WARNING}</p>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              {K.REASON_LABEL}
            </label>
            <textarea
              rows={3}
              autoFocus
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder={K.REASON_PLACEHOLDER}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="text-[10px] text-gray-500 mt-1">
              {reason.trim().length}/10 characters minimum
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Type <span className="font-mono text-red-400">{CONFIRM_WORD}</span> to confirm
            </label>
            <input
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-500 disabled:opacity-50"
            >
              {isPending ? K.WORKING : K.CONFIRM_BUTTON}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KickPlayerModal;