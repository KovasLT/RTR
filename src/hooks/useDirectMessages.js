import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useData } from './useData';

export function useMessages(conversationId, recipientId, onConversationCreated) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch messages – relies on the passed conversationId (may be null)
    const { data: messages = [], isLoading, error, refetch } = useQuery({
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
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    // Send mutation – now we call onConversationCreated when a new conv is made
    const sendMutation = useMutation({
        mutationFn: async (message) => {
            if (!recipientId || !user) throw new Error('Missing recipient or user');

            let convId = conversationId;

            // If no conversation yet, find or create one
            if (!convId) {
                const { data: existing, error: findError } = await supabase
                .from('conversations')
                .select('id')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .or(`user1_id.eq.${recipientId},user2_id.eq.${recipientId}`);

                if (findError) throw findError;

                if (existing && existing.length > 0) {
                    convId = existing[0].id;
                } else {
                    const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({ user1_id: user.id, user2_id: recipientId })
                    .select('id')
                    .single();
                    if (createError) throw createError;
                    convId = newConv.id;
                }
            }

            // Insert message
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

            return { message: data, conversationId: convId };
        },
        onSuccess: (result) => {
            // If we didn't have a conversation before, tell the parent
            if (!conversationId && onConversationCreated) {
                onConversationCreated(result.conversationId);
            }
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['messages', result.conversationId] });
            queryClient.invalidateQueries({ queryKey: ['messaging', user?.id] });
        },
    });

    return {
        messages,
        loading: isLoading,
        error,
        sendMessage: sendMutation.mutateAsync,
        sending: sendMutation.isPending,
        refetch: () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
    };
}

export function useUnreadCount() {
    const { totalUnread = 0 } = useData();
    return totalUnread;
}
