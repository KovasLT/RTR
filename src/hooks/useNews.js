import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const unwrap = (promise) =>
  promise.then((r) => {
    if (r.error) throw r.error;
    return r.data;
  });

const NEWS_SELECT =
  'id, title, body, image_url, status, created_at, author:profiles!news_posts_author_id_fkey(id, display_name, handle, avatar_url)';

/** Approved posts for the public feed (homepage / news page). */
export const useApprovedNews = (limit) =>
  useQuery({
    queryKey: ['news', 'approved', limit ?? 'all'],
    enabled: Boolean(supabase),
    queryFn: async () => {
      let q = supabase
        .from('news_posts')
        .select(NEWS_SELECT)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

/** Posts awaiting review (admins only — RLS returns nothing to others). */
export const usePendingNews = () =>
  useQuery({
    queryKey: ['news', 'pending'],
    enabled: Boolean(supabase),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_posts')
        .select(NEWS_SELECT)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

/** The signed-in user's own submissions (any status). */
export const useMyNews = (userId) =>
  useQuery({
    queryKey: ['news', 'mine', userId],
    enabled: Boolean(supabase) && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_posts')
        .select(NEWS_SELECT)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useNewsMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['news'] });

  const submit = useMutation({
    mutationFn: ({ userId, title, body, imageUrl }) =>
      unwrap(
        supabase.from('news_posts').insert({
          author_id: userId,
          title,
          body,
          image_url: imageUrl || null,
        }),
      ),
    onSuccess: invalidate,
  });

  const review = useMutation({
    mutationFn: ({ id, approve }) =>
      unwrap(supabase.rpc('review_news_post', { p_id: id, p_approved: approve })),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: ({ id }) => unwrap(supabase.from('news_posts').delete().eq('id', id)),
    onSuccess: invalidate,
  });

  return { submit, review, remove };
};
