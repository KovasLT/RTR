import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export const ADMIN_USERS_KEY = ['admin', 'users'];
export const ADMIN_STATS_KEY = ['admin', 'stats'];

/** All users with their roles + admin flag. */
export const useAdminUsers = () =>
  useQuery({
    queryKey: ADMIN_USERS_KEY,
    enabled: Boolean(supabase),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_url, email, is_admin, is_superuser, created_at, roles:user_roles(role)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((u) => ({ ...u, roles: (u.roles ?? []).map((r) => r.role) }));
    },
  });

/** Headline counts for the overview tab. */
export const useAdminStats = () =>
  useQuery({
    queryKey: ADMIN_STATS_KEY,
    enabled: Boolean(supabase),
    queryFn: async () => {
      const count = async (table, applyFilter) => {
        let q = supabase.from(table).select('*', { count: 'exact', head: true });
        if (applyFilter) q = applyFilter(q);
        const { count: c, error } = await q;
        if (error) throw error;
        return c ?? 0;
      };
      const [users, players, admins, superusers, ratings] = await Promise.all([
        count('profiles'),
        count('user_roles', (q) => q.eq('role', 'player')),
        count('profiles', (q) => q.eq('is_admin', true)),
        count('profiles', (q) => q.eq('is_superuser', true)),
        count('ratings'),
      ]);
      return { users, players, admins, superusers, ratings };
    },
  });

/** Recent rating ledger entries for a subject (role + user). */
export const useRatingEvents = (subjectType, subjectId) =>
  useQuery({
    queryKey: ['admin', 'rating_events', subjectType, subjectId],
    enabled: Boolean(supabase) && Boolean(subjectType) && Boolean(subjectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rating_events')
        .select('id, delta, new_rating, reason, note, created_at')
        .eq('subject_type', subjectType)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

const unwrap = (promise) =>
  promise.then((r) => {
    if (r.error) throw r.error;
    return r.data;
  });

/** Admin write actions (all go through SECURITY DEFINER RPCs). */
export const useAdminMutations = () => {
  const qc = useQueryClient();
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['directory'] });
  };

  const setUserAdmin = useMutation({
    mutationFn: ({ userId, isAdmin }) =>
      unwrap(supabase.rpc('set_user_admin', { p_user: userId, p_is_admin: isAdmin })),
    onSuccess: invalidateAll,
  });

  const removeRole = useMutation({
    mutationFn: ({ userId, role }) =>
      unwrap(supabase.rpc('admin_remove_role', { p_user: userId, p_role: role })),
    onSuccess: invalidateAll,
  });

  const adjustRating = useMutation({
    mutationFn: ({ subjectType, subjectId, delta, note }) =>
      unwrap(
        supabase.rpc('admin_adjust_rating', {
          p_subject_type: subjectType,
          p_subject_id: subjectId,
          p_delta: delta,
          p_note: note,
        }),
      ),
    onSuccess: invalidateAll,
  });

  return { setUserAdmin, removeRole, adjustRating };
};
