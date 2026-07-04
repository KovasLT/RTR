import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Helper to unwrap Supabase responses
const unwrap = (promise) =>
promise.then((r) => {
  if (r.error) throw r.error;
  return r.data;
});

// Fetch all endorsements for a given subject (profile)
export const useEndorsements = (subjectId) => {
  return useQuery({
    queryKey: ['endorsements', subjectId],
    enabled: Boolean(supabase) && Boolean(subjectId),
                  queryFn: async () => {
                    const { data, error } = await supabase
                    .from('endorsements')
                    .select('subject_type, endorser_id')
                    .eq('subject_id', subjectId);
                    if (error) throw error;
                    return data || [];
                  },
  });
};

// Mutations to endorse / unendorse
export const useEndorsementMutations = (subjectId) => {
  const qc = useQueryClient();

  const endorse = useMutation({
    mutationFn: async ({ subjectType }) => {
      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      return unwrap(
        supabase.from('endorsements').insert({
          subject_id: subjectId,
          subject_type: subjectType,
          endorser_id: user.id,
        })
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endorsements', subjectId] });
    },
  });

  const unendorse = useMutation({
    mutationFn: async ({ subjectType }) => {
      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      return unwrap(
        supabase
        .from('endorsements')
        .delete()
        .eq('subject_id', subjectId)
        .eq('subject_type', subjectType)
        .eq('endorser_id', user.id)
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endorsements', subjectId] });
    },
  });

  return { endorse, unendorse };
};
