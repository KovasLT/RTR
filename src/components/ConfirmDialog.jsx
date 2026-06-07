import { APP_CONSTANTS } from '../app-constants';

/**
 * Lightweight confirmation modal. Render it conditionally (when there's a
 * pending action) and wire onConfirm / onCancel. Keeps destructive or
 * irreversible edits behind an explicit click.
 */
const ConfirmDialog = ({
  title,
  message,
  detail,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const C = APP_CONSTANTS.CONFIRM;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-gray-700 bg-[#13192b] shadow-2xl p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">{title || C.TITLE}</h3>
        {message && <p className="text-sm text-gray-400 mt-2">{message}</p>}
        {detail && (
          <p className="text-sm text-white font-medium mt-1 break-words">“{detail}”</p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={busy}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50"
          >
            {cancelLabel || C.CANCEL}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {busy ? C.WORKING : confirmLabel || C.CONFIRM}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
