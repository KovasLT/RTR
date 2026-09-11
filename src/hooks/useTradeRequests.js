import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { sendDirectMessage } from '../lib/sendDirectMessage';

const TRADE_SELECT = `
id, status, message, created_at, resolved_at,
player_id, from_team_id, to_team_id, requested_by,
player:profiles!player_id(id, display_name, handle, avatar_url),
from_team:teams!from_team_id(id, name, tag, logo_url),
to_team:teams!to_team_id(id, name, tag, logo_url)
`;

export function useTeamTradeRequests(teamId) {
    return useQuery({
        queryKey: ['trade-requests', teamId],
        enabled: !!teamId,
        queryFn: async () => {
            const { data, error } = await supabase
            .from('trade_requests')
            .select(TRADE_SELECT)
            .or(`from_team_id.eq.${teamId},to_team_id.eq.${teamId}`)
            .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });
}

export function useTradeRequestMutations() {
    const qc = useQueryClient();
    const { user } = useAuth();

    const createTradeRequest = useMutation({
        mutationFn: async ({ playerId, fromTeamId, toTeamId, message }) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
            .from('trade_requests')
            .insert({
                player_id: playerId,
                from_team_id: fromTeamId,
                to_team_id: toTeamId,
                requested_by: user.id,
                message: message || null,
                status: 'pending',
            })
            .select()
            .single();
            if (error) throw error;

            // Notify receiving team's manager (best-effort)
            try {
                const { data: toTeam } = await supabase
                .from('teams')
                .select('manager_id, name')
                .eq('id', toTeamId)
                .single();
                if (toTeam?.manager_id && toTeam.manager_id !== user.id) {
                    await sendDirectMessage({
                        senderId: user.id,
                        recipientId: toTeam.manager_id,
                        message:
                        `Trade request: a player has been offered to ${toTeam.name}.` +
                        (message ? `\n\nMessage: ${message}` : ''),
                    });
                }
            } catch (e) {
                console.warn('Trade DM failed:', e);
            }

            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['trade-requests'] }),
    });

    const respondToTradeRequest = useMutation({
        mutationFn: async ({ request, accept }) => {
            if (!user) throw new Error('Not authenticated');

            const { data: req, error: fetchErr } = await supabase
            .from('trade_requests')
            .select('*')
            .eq('id', request.id)
            .single();
            if (fetchErr) throw fetchErr;
            if (req.status !== 'pending') throw new Error('Request already resolved.');

            const { data: toTeam, error: teamErr } = await supabase
            .from('teams')
            .select('manager_id, name')
            .eq('id', req.to_team_id)
            .single();
            if (teamErr) throw teamErr;
            if (toTeam.manager_id !== user.id) {
                throw new Error('Only the receiving team manager can respond.');
            }

            if (accept) {
                const now = new Date().toISOString();

                // 1. Close source membership with left_reason = 'trade' (skips penalty)
                const { error: leaveErr } = await supabase
                .from('team_members')
                .update({ left_at: now, left_reason: 'trade' })
                .eq('team_id', req.from_team_id)
                .eq('user_id', req.player_id)
                .is('left_at', null);
                if (leaveErr) throw leaveErr;

                // 2. Join destination team (after source is closed, because
                //    enforce_one_active_team_trigger runs BEFORE INSERT)
                const { error: addErr } = await supabase
                .from('team_members')
                .insert({
                    team_id: req.to_team_id,
                    user_id: req.player_id,
                    role: 'player',
                    joined_at: now,
                });
                if (addErr) throw addErr;
            }

            const { data: updated, error: updateErr } = await supabase
            .from('trade_requests')
            .update({
                status: accept ? 'accepted' : 'rejected',
                resolved_at: new Date().toISOString(),
            })
            .eq('id', req.id)
            .select()
            .single();
            if (updateErr) throw updateErr;

            // Notify involved parties (best-effort)
            try {
                const { data: fromTeam } = await supabase
                .from('teams')
                .select('manager_id, name')
                .eq('id', req.from_team_id)
                .single();

                if (fromTeam?.manager_id) {
                    await sendDirectMessage({
                        senderId: user.id,
                        recipientId: fromTeam.manager_id,
                        message: accept
                        ? `Trade accepted: your player has joined ${toTeam.name}.`
                        : `Trade rejected: ${toTeam.name} declined the trade request.`,
                    });
                }
                await sendDirectMessage({
                    senderId: user.id,
                    recipientId: req.player_id,
                    message: accept
                    ? `You have been transferred to ${toTeam.name}.`
                    : `A trade involving you was declined.`,
                });
            } catch (e) {
                console.warn('Trade response DM failed:', e);
            }

            return updated;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['trade-requests'] });
            qc.invalidateQueries({ queryKey: ['team'] });
            qc.invalidateQueries({ queryKey: ['teams'] });
        },
    });

    const cancelTradeRequest = useMutation({
        mutationFn: async ({ id }) => {
            const { data, error } = await supabase
            .from('trade_requests')
            .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
            .eq('id', id)
            .eq('requested_by', user.id)
            .select()
            .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['trade-requests'] }),
    });

    return { createTradeRequest, respondToTradeRequest, cancelTradeRequest };
}
