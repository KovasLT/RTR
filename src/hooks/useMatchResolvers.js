// Hook: React Query mutation for organizational match resolution
// Path: src/hooks/useMatchResolvers.js

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Custom hook to resolve a match and automatically recalculate
 * Elo ratings for the teams and all their associated members.
 */
export function useResolveMatchWithAllMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ teamAId, teamBId, teamAOutcome }) => {
            // Calls the SECURITY DEFINER function in your Supabase Postgres database
            const { data, error } = await supabase.rpc('resolve_match_with_all_members', {
                p_team_a_id: teamAId,
                p_team_b_id: teamBId,
                p_team_a_outcome: teamAOutcome // 1.0 for Team A win, 0.0 for Team B win
            });

            if (error) {
                throw new Error(error.message);
            }
            return data;
        },
        onSuccess: () => {
            // Automatically refetches and updates the UI everywhere these keys are used
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['rating_events'] });
        }
    });
}
// Hook for the first team Manager (Proposing the score)
export function useReportMatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ matchId, teamId, teamAScore, teamBScore, outcome }) => {
            const { error } = await supabase.rpc('report_match_outcome', {
                p_match_id: matchId,
                p_reporting_team_id: teamId,
                p_team_a_score: teamAScore,
                p_team_b_score: teamBScore,
                p_proposed_outcome: outcome
            });
            if (error) throw new Error(error.message);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] })
    });
}

// Hook for the opposing team Manager (Confirming the score to trigger Elo)
export function useConfirmMatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ matchId, confirmingTeamId }) => {
            const { error } = await supabase.rpc('confirm_match_outcome', {
                p_match_id: matchId,
                p_confirming_team_id: confirmingTeamId
            });
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['rating_events'] });
        }
    });
}
