import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const unwrap = (promise) =>
  promise.then((r) => {
    if (r.error) throw r.error;
    return r.data;
  });

/** All endorsement rows for a profile (across roles). Public read. */
export const useEndorsements = (subjectId) =>
  useQuery({
    queryKey: ['endorsements', subjectId],
    enabled: Boolean(supabase) && Boolean(subjectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('endorsements')
        .select('subject_type, endorser_id')
        .eq('subject_id', subjectId);
      if (error) throw error;
      return data ?? [];
    },
  });

/** Endorse / withdraw via the SECURITY DEFINER functions. */
export const useEndorsementMutations = (subjectId) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['endorsements', subjectId] });
    qc.invalidateQueries({ queryKey: ['profile', subjectId] });
    qc.invalidateQueries({ queryKey: ['rankings'] });
  };

  const endorse = useMutation({
    mutationFn: ({ subjectType }) =>
      unwrap(supabase.rpc('endorse_subject', { p_subject_type: subjectType, p_subject_id: subjectId })),
    onSuccess: invalidate,
  });

  const unendorse = useMutation({
    mutationFn: ({ subjectType }) =>
      unwrap(supabase.rpc('unendorse_subject', { p_subject_type: subjectType, p_subject_id: subjectId })),
    onSuccess: invalidate,
  });

  return { endorse, unendorse };
};
