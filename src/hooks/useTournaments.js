import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useTournaments(userId) {
  const queryClient = useQueryClient();

  const tournamentsQuery = useQuery({
    queryKey: ['tournaments', userId || 'all'],
    queryFn: async () => {
      let query = supabase
      .from('tournaments')
      .select(`
      *,
      tournament_teams (
        team_id,
        placement
      )
      `);
      if (userId) {
        query = query.eq('created_by', userId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const createTournament = useMutation({
    mutationFn: async (payload) => {
      if (!userId) throw new Error('User ID required to create tournament');
      const { data, error } = await supabase
      .from('tournaments')
      .insert([{ ...payload, created_by: userId }])
      .select()
      .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments', userId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments', 'all'] });
    },
  });

  const updateTournament = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (!userId) throw new Error('User ID required to update tournament');
      const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments', userId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', data.id] });
    },
  });

  // ── NEW: Close Tournament ──
  const closeTournament = useMutation({
    mutationFn: async ({ id, placements, bonusMap }) => {
      const { error: statusErr } = await supabase
      .from('tournaments')
      .update({ status: 'closed' })
      .eq('id', id);
      if (statusErr) throw statusErr;

      for (const p of placements) {
        await supabase
        .from('tournament_teams')
        .update({ placement: p.placement })
        .eq('tournament_id', id)
        .eq('team_id', p.teamId);

        const bonusAmount =
        p.placement === 1 ? bonusMap.first :
        p.placement === 2 ? bonusMap.second :
        p.placement === 3 ? bonusMap.third :
        0;
        if (bonusAmount > 0) {
          await supabase.rpc('award_tournament_bonus_elo', {
            p_team_id: p.teamId,
            p_bonus_elo: bonusAmount,
            p_reason: `Tournament Standing Finish Rank: #${p.placement}`,
          });
        }
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments', userId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
    },
  });

  return {
    data: tournamentsQuery.data || [],
    isLoading: tournamentsQuery.isLoading,
    createTournament,
    updateTournament,
    closeTournament, // now exposed
  };
}

// (useSingleTournament remains as before – it already has its own closeTournament)
