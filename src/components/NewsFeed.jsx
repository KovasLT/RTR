import { Link } from 'react-router-dom';
import { useApprovedNews } from '../hooks/useNews.js';
import { APP_CONSTANTS } from '../app-constants';

const N = APP_CONSTANTS.NEWS;

const authorName = (a) => a?.display_name || a?.handle || 'Member';

/** A single approved news post. `compact` truncates the body + shows a thumb. */
export const NewsCard = ({ post, compact = false }) => (
  <article className="border-l-2 border-indigo-500/80 pl-4 py-1">
    <div className={compact ? 'flex gap-3' : ''}>
      <div className="min-w-0 flex-grow">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span>·</span>
          <span>{N.BY} {authorName(post.author)}</span>
        </div>
        <h4 className="text-sm font-bold text-slate-100 mt-1">{post.title}</h4>
        {post.image_url && !compact && (
          <img src={post.image_url} alt="" className="mt-2 rounded-lg max-h-64 w-full object-cover border border-slate-800" />
        )}
        <p className={`text-xs text-slate-400 mt-1 leading-relaxed whitespace-pre-line ${compact ? 'line-clamp-3' : ''}`}>
          {post.body}
        </p>
      </div>
      {compact && post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-800 shrink-0"
        />
      )}
    </div>
  </article>
);

/**
 * Reusable approved-news feed (fetches its own data). Used on the homepage,
 * the dashboard overview, and the full News page.
 */
const NewsFeed = ({ limit, compact = false, showViewAll = false }) => {
  const { data: posts = [], isLoading } = useApprovedNews(limit);

  if (isLoading) return <p className="text-sm text-slate-500">…</p>;
  if (posts.length === 0) return <p className="text-sm text-slate-400">{N.FEED_EMPTY}</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <NewsCard key={post.id} post={post} compact={compact} />
      ))}
      {showViewAll && (
        <Link to="/news" className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300">
          {N.VIEW_ALL} <i className="fas fa-arrow-right ml-1"></i>
        </Link>
      )}
    </div>
  );
};

export default NewsFeed;
