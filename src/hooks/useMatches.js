import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * All the actions (mutations) you can take on a match.
 * Think of these as Python functions that execute an INSERT or UPDATE statement.
 */
export function useMatchMutations() {
    const queryClient = useQueryClient();

    // 1. Submit a new match report
    const submitMatchReport = useMutation({
        mutationFn: async (payload) => {
            const { data, error } = await supabase
            .from('matches')
            .insert([payload])
            .select()
            .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            // This tells React to refresh any UI showing match data
            queryClient.invalidateQueries({ queryKey: ['matches'] });
        },
    });

    // 2. Confirm a match (Opposing team agrees with the score)
    const confirmMatch = useMutation({
        mutationFn: async ({ matchId, teamAId, teamBId, scoreA, scoreB }) => {
            // First: Mark it confirmed in the database
            const { error: updateErr } = await supabase
            .from('matches')
            .update({ status: 'confirmed' })
            .eq('id', matchId);

            if (updateErr) throw new Error(updateErr.message);

            // Second: Tell Supabase to run the Elo Math calculation via RPC
            // (We will add this SQL function to your database in the next step)
            const { error: rpcErr } = await supabase.rpc('process_match_elo', {
                p_match_id: matchId,
                p_team_a_id: teamAId,
                p_team_b_id: teamBId,
                p_score_a: scoreA,
                p_score_b: scoreB
            });

            if (rpcErr) throw new Error(rpcErr.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['teams'] }); // Refresh the leaderboard
        },
    });

    // 3. Dispute a match (Opposing team disagrees)
    const disputeMatch = useMutation({
        mutationFn: async (matchId) => {
            const { error } = await supabase
            .from('matches')
            .update({ status: 'disputed', admin_notified: true })
            .eq('id', matchId);

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
        },
    });

    return { submitMatchReport, confirmMatch, disputeMatch };
}

/**
 * A query to fetch matches waiting for confirmation.
 * Think of this as a Python SELECT statement that automatically re-runs if data changes.
 */
export function usePendingMatches(teamId) {
    return useQuery({
        queryKey: ['matches', 'pending', teamId],
        queryFn: async () => {
            if (!teamId) return [];

            const { data, error } = await supabase
            .from('matches')
            .select(`
            *,
            team_a:team_a_id(name, tag),
                    team_b:team_b_id(name, tag)
                    `)
            .eq('status', 'pending_confirmation')
            .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
            .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);

            // Filter out matches that the user's OWN team reported,
            // so they only see matches their opponent submitted that require their approval.
            return data.filter(m => m.reporting_team_id !== teamId);
        },
        enabled: !!teamId, // Only run this if the user actually belongs to a team
    });
}
