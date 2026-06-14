import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useMatchMutations() {
    const queryClient = useQueryClient();

    // Team match (5v5)
    const submitMatchReport = useMutation({
        mutationFn: async (payload) => {
            const { data, error } = await supabase.rpc('report_match_immediate', {
                p_team_a_id: payload.team_a_id,
                p_team_b_id: payload.team_b_id,
                p_score_a: payload.score_team_a,
                p_score_b: payload.score_team_b,
                p_reported_by_id: payload.reporter_id,
                p_match_info: payload.match_info,
                p_match_type: payload.match_type,
                p_tournament_id: payload.tournament_id || null,
                p_match_date: payload.match_date
            });
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['userMatches'] });
        },
    });

    // Player match (1v1)
    const submitPlayerMatchReport = useMutation({
        mutationFn: async (payload) => {
            const { data, error } = await supabase.rpc('report_player_match_immediate', {
                p_player_a_id: payload.player_a_id,
                p_player_b_id: payload.player_b_id,
                p_score_a: payload.score_team_a,
                p_score_b: payload.score_team_b,
                p_reported_by_id: payload.reporter_id,
                p_match_info: payload.match_info,
                p_match_type: payload.match_type,
                p_tournament_id: payload.tournament_id || null,
                p_match_date: payload.match_date
            });
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['player_matches'] });
            queryClient.invalidateQueries({ queryKey: ['ratings'] });
            queryClient.invalidateQueries({ queryKey: ['userMatches'] });
        },
    });

    return { submitMatchReport, submitPlayerMatchReport };
}
