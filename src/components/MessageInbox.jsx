import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useData } from '../hooks/useData';
import { APP_CONSTANTS } from '../app-constants';

export default function MessageInbox({ onSelectConversation, selectedId }) {
  const { user } = useAuth();
  const { conversations, refetchMessages } = useData();
  const [refreshing, setRefreshing] = useState(false);

  // Mark all unread messages in a conversation as read
  const markConversationAsRead = async (conversationId) => {
    if (!conversationId || !user) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    if (error) console.error('Error marking messages as read:', error);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchMessages();
    setRefreshing(false);
  };

  // When a conversation is selected, mark as read, refresh, then open it
  const handleSelect = async (convId, otherUser) => {
    if (convId) {
      await markConversationAsRead(convId);
      // Refresh the messaging data to update the unread counts
      await refetchMessages();
    }
    onSelectConversation(convId, otherUser);
  };

  if (!conversations) return <div className="p-4 text-gray-500 text-center">Loading conversations...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Warning banner */}
      <div className="p-3 border-b border-amber-800/40 bg-amber-900/20 text-amber-200 text-xs flex items-start gap-2">
        <i className="fas fa-info-circle mt-0.5"></i>
        <span>
          This is a community‑run website, not a real‑time chat. For longer conversations, please use our{' '}
          <a
            href={APP_CONSTANTS.WELCOME.LINKS.DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 hover:text-amber-200 underline"
          >
            Discord server
          </a>
          .<br />
          Messages are updated only when you log in or refresh manually.
        </span>
      </div>

      <div className="p-3 border-b border-gray-800 flex justify-between items-center">
        <div className="font-bold text-white">Messages</div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
          title="Refresh messages"
        >
          <i className={`fas fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
          <span className="ml-1">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
        {conversations.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm text-center">No conversations yet.</div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id, conv.other_user)}
              className={`w-full text-left p-3 hover:bg-gray-800/50 transition flex justify-between items-center ${selectedId === conv.id ? 'bg-gray-800' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  {conv.other_user?.display_name || conv.other_user?.handle || 'Unknown'}
                </div>
                <div className="text-gray-400 text-xs truncate">{conv.last_message || 'No messages yet'}</div>
              </div>
              {conv.unread_count > 0 && (
                <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                  {conv.unread_count}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}