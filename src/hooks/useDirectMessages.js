import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Fetch all conversations for the current user, with the other user's profile
export function useConversations() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            const { data: convs, error } = await supabase
            .from('conversations')
            .select('id, user1_id, user2_id, last_message, last_message_at, created_at')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false });

            if (error) {
                console.error('Error fetching conversations:', error);
                setLoading(false);
                return;
            }

            if (!convs.length) {
                setConversations([]);
                setLoading(false);
                return;
            }

            const otherUserIds = convs.map(conv =>
            conv.user1_id === user.id ? conv.user2_id : conv.user1_id
            );

            const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, handle, avatar_url')
            .in('id', otherUserIds);

            if (profileError) {
                console.error('Error fetching profiles:', profileError);
                setLoading(false);
                return;
            }

            const profilesMap = new Map(profiles.map(p => [p.id, p]));
            const enriched = convs.map(conv => {
                const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
                return {
                    ...conv,
                    other_user: profilesMap.get(otherId) || { id: otherId, display_name: 'Unknown' }
                };
            });

            setConversations(enriched);
            setLoading(false);
        };

        fetchConversations();

        // Real-time updates for conversations – correct order: add listeners then subscribe
        const channel = supabase
        .channel('conversations-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, fetchConversations)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, fetchConversations)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchConversations);

        channel.subscribe();

        return () => channel.unsubscribe();
    }, [user]);

    return { conversations, loading };
}

// Hook for messages in a specific conversation
export function useMessages(conversationId, recipientId) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentConvId, setCurrentConvId] = useState(conversationId);
    const [sending, setSending] = useState(false);

    const fetchMessages = useCallback(async (convId) => {
        const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(200);
        if (!error) setMessages(data || []);
    }, []);

        const markAsRead = useCallback(async (convId) => {
            if (!convId) return;
            const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', convId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
            if (error) console.error('Error marking messages as read:', error);
        }, [user.id]);

            useEffect(() => {
                let channel = null;

                const init = async () => {
                    let convId = conversationId;
                    if (!convId && recipientId) {
                        const { data: existing } = await supabase
                        .from('conversations')
                        .select('id')
                        .or(`and(user1_id.eq.${user.id},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${user.id})`)
                        .maybeSingle();
                        if (existing) {
                            convId = existing.id;
                        } else {
                            const { data: newConv, error } = await supabase
                            .from('conversations')
                            .insert({ user1_id: user.id, user2_id: recipientId })
                            .select()
                            .single();
                            if (!error) convId = newConv.id;
                        }
                        setCurrentConvId(convId);
                    }

                    if (convId) {
                        await fetchMessages(convId);
                        await markAsRead(convId);

                        // Create channel and add listener BEFORE subscribe
                        channel = supabase
                        .channel(`messages:${convId}`)
                        .on('postgres_changes', {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'messages',
                            filter: `conversation_id=eq.${convId}`
                        }, async (payload) => {
                            setMessages(prev => [...prev, payload.new]);
                            if (payload.new.receiver_id === user.id && !payload.new.is_read) {
                                await supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id);
                            }
                        });

                        channel.subscribe();
                    }
                    setLoading(false);
                };

                init();

                return () => {
                    if (channel) channel.unsubscribe();
                };
            }, [conversationId, recipientId, user.id, fetchMessages, markAsRead]);

            const sendMessage = useCallback(async (targetId, message) => {
                if (sending) return;
                setSending(true);
                let convId = currentConvId;
                if (!convId && targetId) {
                    const { data: existing } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${user.id})`)
                    .maybeSingle();
                    if (existing) {
                        convId = existing.id;
                    } else {
                        const { data: newConv, error } = await supabase
                        .from('conversations')
                        .insert({ user1_id: user.id, user2_id: targetId })
                        .select()
                        .single();
                        if (error) throw error;
                        convId = newConv.id;
                    }
                    setCurrentConvId(convId);
                }
                if (!convId) throw new Error('No conversation ID');

                const tempId = `temp-${Date.now()}`;
                const newMessage = {
                    id: tempId,
                    conversation_id: convId,
                    sender_id: user.id,
                    receiver_id: targetId,
                    message,
                    is_read: false,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, newMessage]);

                const { error } = await supabase.from('messages').insert({
                    conversation_id: convId,
                    sender_id: user.id,
                    receiver_id: targetId,
                    message,
                });
                if (error) {
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    throw error;
                }
                await supabase
                .from('conversations')
                .update({ last_message: message, last_message_at: new Date() })
                .eq('id', convId);
                setSending(false);
                return convId;
            }, [user.id, currentConvId, sending]);

            return { messages, loading, sendMessage, sending };
}

// Hook to get total unread count for the current user (polling version, no realtime errors)
export function useUnreadCount() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = useCallback(async () => {
        if (!user) return;
        const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
        if (!error) setUnreadCount(count || 0);
    }, [user]);

        useEffect(() => {
            fetchUnread();
            const interval = setInterval(fetchUnread, 10000);
            return () => clearInterval(interval);
        }, [fetchUnread]);

        return { unreadCount };
}
