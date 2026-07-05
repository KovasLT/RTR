import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useData } from './useData';

/**
 * Hook for fetching and sending messages in a specific conversation.
 * Automatically creates a new conversation if none exists.
 */
export function useMessages(conversationId, recipientId) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch messages if we have a conversation ID
    const { data: messages = [], isLoading, error } = useQuery({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: !!conversationId,
        staleTime: Infinity,          // never auto‑refetch
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    // Mutation to send a message (and create conversation if needed)
    const sendMutation = useMutation({
        mutationFn: async (message) => {
            if (!recipientId || !user) throw new Error('Missing recipient or user');

            let convId = conversationId;

            // If no conversation yet, create one
            if (!convId) {
                // Check if a conversation already exists between these two users
                const { data: existing, error: findError } = await supabase
                .from('conversations')
                .select('id')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .or(`user1_id.eq.${recipientId},user2_id.eq.${recipientId}`);

                if (findError) throw findError;

                if (existing && existing.length > 0) {
                    convId = existing[0].id;
                } else {
                    // Create new conversation
                    const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({ user1_id: user.id, user2_id: recipientId })
                    .select('id')
                    .single();
                    if (createError) throw createError;
                    convId = newConv.id;
                }
            }

            // Insert the message
            const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: convId,
                sender_id: user.id,
                receiver_id: recipientId,
                message: message,
            })
            .select()
            .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate messages query to refetch
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            // Invalidate the central messaging cache (used by useData)
            queryClient.invalidateQueries({ queryKey: ['messaging', user?.id] });
        },
    });

    return {
        messages,
        loading: isLoading,
        error,
        sendMessage: sendMutation.mutateAsync,
        sending: sendMutation.isPending,
        // manual refresh – invalidate the messages query
        refetch: () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
    };
}

/**
 * Hook returning the total number of unread messages.
 * Reads from the central useData cache – no extra DB query.
 */
export function useUnreadCount() {
    const { totalUnread = 0 } = useData();
    return totalUnread;
}
