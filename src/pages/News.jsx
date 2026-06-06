import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { usePendingNews, useMyNews, useNewsMutations } from '../hooks/useNews.js';
import NewsFeed, { NewsCard } from '../components/NewsFeed';
import { APP_CONSTANTS } from '../app-constants';

const N = APP_CONSTANTS.NEWS;
const inputClass =
  'w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500';

const STATUS_STYLES = {
  pending: 'bg-amber-900/30 border-amber-700/50 text-amber-300',
  approved: 'bg-green-900/30 border-green-700/50 text-green-300',
  rejected: 'bg-red-900/30 border-red-700/50 text-red-300',
};

const StatusBadge = ({ status }) => (
  <span className={`text-[10px] uppercase tracking-wide font-semibold border rounded px-2 py-0.5 ${STATUS_STYLES[status]}`}>
    {N.STATUS[status] || status}
  </span>
);

/** Submission form (collapsible). */
const SubmitForm = ({ userId, onDone }) => {
  const { submit } = useNewsMutations();
  const [form, setForm] = useState({ title: '', body: '', imageUrl: '' });
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await submit.mutateAsync({ userId, title: form.title, body: form.body, imageUrl: form.imageUrl });
      setForm({ title: '', body: '', imageUrl: '' });
      setDone(true);
    } catch (err) {
      setError(err.message || N.ERROR);
    }
  };

  if (done) {
    return (
      <div className="rtr-card text-sm text-green-400 flex items-center justify-between gap-3">
        <span><i className="fas fa-circle-check mr-2"></i>{N.SUBMITTED_NOTE}</span>
        <button onClick={onDone} className="text-gray-400 hover:text-white text-xs">{N.CANCEL}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rtr-card space-y-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input className={inputClass} placeholder={N.FORM_TITLE} value={form.title} onChange={(e) => set('title', e.target.value)} required />
      <textarea className={inputClass} rows={5} placeholder={N.FORM_BODY} value={form.body} onChange={(e) => set('body', e.target.value)} required />
      <input className={inputClass} placeholder={N.FORM_IMAGE} value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
      <div className="flex gap-2">
        <button type="submit" disabled={submit.isPending} className="rtr-btn-primary justify-center disabled:opacity-50">
          {submit.isPending ? N.FORM_SUBMITTING : N.FORM_SUBMIT}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-white px-4">{N.CANCEL}</button>
      </div>
    </form>
  );
};

/** Admin moderation queue. usePendingNews returns rows only to admins (RLS). */
const ModerationQueue = () => {
  const { data: pending = [] } = usePendingNews();
  const { review, remove } = useNewsMutations();

  if (pending.length === 0) return null;

  return (
    <div className="rtr-card border-amber-800/40">
      <h3 className="text-lg font-semibold text-white mb-3">
        <i className="fas fa-gavel mr-2 text-amber-300"></i>{N.PENDING_TITLE}
        <span className="ml-2 text-xs text-amber-300">{pending.length}</span>
      </h3>
      <div className="space-y-4">
        {pending.map((post) => (
          <div key={post.id} className="border-b border-gray-800 pb-4 last:border-0">
            <NewsCard post={post} />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => review.mutate({ id: post.id, approve: true })}
                className="text-xs font-semibold bg-green-900/30 border border-green-700/50 text-green-300 rounded px-3 py-1 hover:bg-green-900/50"
              >
                {N.APPROVE}
              </button>
              <button
                onClick={() => review.mutate({ id: post.id, approve: false })}
                className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500"
              >
                {N.REJECT}
              </button>
              <button
                onClick={() => remove.mutate({ id: post.id })}
                className="text-xs font-semibold text-gray-500 hover:text-red-400 rounded px-3 py-1 ml-auto"
              >
                {N.DELETE}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** The author's own submissions with their review status. */
const MySubmissions = ({ userId }) => {
  const { data: mine = [] } = useMyNews(userId);
  const { remove } = useNewsMutations();

  return (
    <div className="rtr-card">
      <h3 className="text-lg font-semibold text-white mb-3">{N.MINE_TITLE}</h3>
      {mine.length === 0 ? (
        <p className="text-sm text-gray-400">{N.MINE_EMPTY}</p>
      ) : (
        <div className="space-y-2">
          {mine.map((post) => (
            <div key={post.id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
              <span className="text-white font-medium flex-grow min-w-0 truncate">{post.title}</span>
              <StatusBadge status={post.status} />
              <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
              <button onClick={() => remove.mutate({ id: post.id })} className="text-xs text-gray-500 hover:text-red-400">{N.DELETE}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const News = () => {
  const { user, isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{N.TITLE}</h1>
          <p className="text-gray-400">{N.SUBTITLE}</p>
        </div>
        {isAuthenticated && !submitting && (
          <button onClick={() => setSubmitting(true)} className="rtr-btn-primary">
            <i className="fas fa-plus mr-2"></i>{N.SUBMIT}
          </button>
        )}
      </div>

      {submitting && <SubmitForm userId={user.id} onDone={() => setSubmitting(false)} />}

      {/* Admins see the moderation queue here (empty for everyone else). */}
      <ModerationQueue />

      {isAuthenticated && <MySubmissions userId={user.id} />}

      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-3">{N.FEED_TITLE}</h3>
        <NewsFeed />
      </div>
    </div>
  );
};

export default News;
