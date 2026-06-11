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
      // Only filter by created_by if userId is provided
      if (userId) {
        query = query.eq('created_by', userId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: true, // always fetch, even without userId
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

  return {
    data: tournamentsQuery.data || [],
    isLoading: tournamentsQuery.isLoading,
    createTournament,
  };
}

export function useSingleTournament(tournamentId) {
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();
      if (tErr) throw tErr;

      const { data: teams, error: teamsErr } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournamentId);
      if (teamsErr) throw teamsErr;

      const { data: matches, error: mErr } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_order', { ascending: true });
      if (mErr) throw mErr;

      return { ...tournament, teams, matches };
    },
    enabled: !!tournamentId,
  });

  const startTournament = useMutation({
    mutationFn: async ({ id, matches }) => {
      const { error: statusErr } = await supabase
      .from('tournaments')
      .update({ status: 'ongoing' })
      .eq('id', id);
      if (statusErr) throw statusErr;

      if (matches && matches.length > 0) {
        const { error: mErr } = await supabase.from('tournament_matches').insert(matches);
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });

  const updateMatchNode = useMutation({
    mutationFn: async ({ matchId, teamAScore, teamBScore, winnerId }) => {
      const { error } = await supabase
      .from('tournament_matches')
      .update({
        reported_team_a_score: teamAScore,
        reported_team_b_score: teamBScore,
        winner_id: winnerId,
        status: 'completed'
      })
      .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    }
  });

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

        const bonusAmount = p.placement === 1 ? bonusMap.first : p.placement === 2 ? bonusMap.second : p.placement === 3 ? bonusMap.third : 0;
        if (bonusAmount > 0) {
          await supabase.rpc('award_tournament_bonus_elo', {
            p_team_id: p.teamId,
            p_bonus_elo: bonusAmount,
            p_reason: `Tournament Standing Finish Rank: #${p.placement}`,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });

  return {
    tournament: detailsQuery.data,
    isLoading: detailsQuery.isLoading,
    startTournament,
    updateMatchNode,
    closeTournament,
  };
}
