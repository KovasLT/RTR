import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useData } from './useData';

export function useMessages(initialConversationId, recipientId) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Keep track of the actual conversation ID (may be updated after sending)
    const [conversationId, setConversationId] = useState(initialConversationId);

    // Fetch messages for the current conversationId
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

    // Mutation to send a message (creates conversation if needed)
    const sendMutation = useMutation({
        mutationFn: async (message) => {
            if (!recipientId || !user) throw new Error('Missing recipient or user');

            let convId = conversationId;

            // If no conversation yet, find or create one
            if (!convId) {
                // Check if a conversation already exists
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

            // Return both the new message and the conversation ID
            return { message: data, conversationId: convId };
        },
        onSuccess: (result) => {
            // Update our local conversation ID if it was null
            if (!conversationId && result.conversationId) {
                setConversationId(result.conversationId);
            }
            // Invalidate messages for this conversation
            queryClient.invalidateQueries({ queryKey: ['messages', result.conversationId] });
            // Invalidate the central messaging cache (used by useData)
            queryClient.invalidateQueries({ queryKey: ['messaging', user?.id] });
        },
    });

    // Manual refresh function (just invalidates the query)
    const refreshMessages = () => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    };

    return {
        messages,
        loading: isLoading,
        error,
        conversationId, // may be updated after send
        sendMessage: sendMutation.mutateAsync,
        sending: sendMutation.isPending,
        refetch: refreshMessages,
    };
}

export function useUnreadCount() {
    const { totalUnread = 0 } = useData();
    return totalUnread;
}
