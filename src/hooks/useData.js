import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * Central data fetcher for the entire application.
 * Fetches static JSON data + authenticated messaging data in one go.
 *
 * @returns {Object} Data object containing:
 * @returns {Array} teams - Array of team objects sorted by rating (desc)
 * @returns {Array} players - Array of player objects sorted by rating (desc)
 * @returns {Array} news - Array of news/update objects
 * @returns {Array} events - Array of upcoming tournament objects
 * @returns {Object} community - Object containing community resources
 * @returns {Object} stats - Object containing application statistics
 * @returns {Array} conversations - Array of conversation objects with unread counts
 * @returns {number} totalUnread - Total unread messages count
 * @returns {function} refetchMessages - Function to manually refresh messaging data
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {string|null} error - Error message if fetch fails
 */
export const useData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ========================================
  // STATIC DATA (JSON files)
  // ========================================
  const staticQuery = useQuery({
    queryKey: ['staticData'],
    queryFn: async () => {
      const [teamsResponse, playersResponse, newsResponse, eventsResponse, communityResponse, statsResponse] = await Promise.all([
        fetch('/data/teams.json').then(res => res.json()).catch(() => []),
                                                                                                                                 fetch('/data/players.json').then(res => res.json()).catch(() => []),
                                                                                                                                 fetch('/data/news.json').then(res => res.json()).catch(() => []),
                                                                                                                                 fetch('/data/events.json').then(res => res.json()).catch(() => []),
                                                                                                                                 fetch('/data/community.json').then(res => res.json()).catch(() => ({})),
                                                                                                                                 fetch('/data/stats.json').then(res => res.json()).catch(() => ({}))
      ]);

      // Normalize nested structures
      const processedTeams = Array.isArray(teamsResponse) ? teamsResponse : teamsResponse.teams || [];
      const processedPlayers = Array.isArray(playersResponse) ? playersResponse : playersResponse.players || [];

      return {
        teams: processedTeams.sort((a, b) => b.rating - a.rating),
                               players: processedPlayers.sort((a, b) => b.rating - a.rating),
                               news: newsResponse,
                               events: eventsResponse,
                               community: communityResponse,
                               stats: statsResponse,
      };
    },
    staleTime: Infinity, // never auto-refetch
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // ========================================
  // MESSAGING DATA (Supabase – authenticated)
  // ========================================
  const messagingQuery = useQuery({
    queryKey: ['messaging', user?.id],
    queryFn: async () => {
      if (!user) {
        return { conversations: [], totalUnread: 0 };
      }

      // 1. Fetch conversations with the other user's profile and last message
      const { data: convs, error: convError } = await supabase
      .from('conversations')
      .select(`
      id,
      user1_id,
      user2_id,
      messages!left (
        id,
        sender_id,
        receiver_id,
        message,
        is_read,
        created_at
      )
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { foreignTable: 'messages', ascending: false });

      if (convError) throw convError;

      // Process each conversation
      const processed = await Promise.all(convs.map(async (conv) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        // Get other user's profile
        const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, handle, avatar_url')
        .eq('id', otherUserId)
        .single();

        // Count unread messages for this conversation
        const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

        const lastMessage = conv.messages?.[0]?.message || null;

        return {
          id: conv.id,
          other_user: profile || { display_name: 'Unknown', handle: '' },
          last_message: lastMessage,
          unread_count: unreadCount || 0,
        };
      }));

      // 2. Get total unread count
      const { count: totalUnread, error: totalError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

      if (totalError) throw totalError;

      return {
        conversations: processed,
        totalUnread: totalUnread || 0,
      };
    },
    enabled: !!user, // only run when user is logged in
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // ========================================
  // COMBINE & EXPOSE
  // ========================================
  const isLoading = staticQuery.isLoading || messagingQuery.isLoading;
  const error = staticQuery.error?.message || messagingQuery.error?.message || null;

  const staticData = staticQuery.data || {
    teams: [],
    players: [],
    news: [],
    events: [],
    community: {},
    stats: {},
  };

  const messagingData = messagingQuery.data || {
    conversations: [],
    totalUnread: 0,
  };

  return {
    ...staticData,
    conversations: messagingData.conversations,
    totalUnread: messagingData.totalUnread,
    refetchMessages: messagingQuery.refetch, // for manual refresh in inbox
    isLoading,
    error,
  };
};
