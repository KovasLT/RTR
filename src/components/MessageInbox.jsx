import { useState, useEffect } from 'react';
import { useConversations } from '../hooks/useDirectMessages';
import { supabase } from '../lib/supabase';

export default function MessageInbox({ onSelectConversation, selectedId }) {
  const { conversations, loading } = useConversations();
  const [unreadCounts, setUnreadCounts] = useState({});

  const fetchUnreadCounts = async () => {
    const counts = {};
    for (const conv of conversations) {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('receiver_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_read', false);
      if (!error) counts[conv.id] = count || 0;
    }
    setUnreadCounts(counts);
  };

  useEffect(() => {
    if (conversations.length) fetchUnreadCounts();
  }, [conversations]);

  // Subscribe to new messages to update unread counts in real time
  useEffect(() => {
    const subscription = supabase
      .channel('inbox-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchUnreadCounts())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => fetchUnreadCounts())
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  const handleSelect = (convId, otherUser) => {
    onSelectConversation(convId, otherUser);
    // Immediately clear the unread count for this conversation
    setUnreadCounts(prev => ({ ...prev, [convId]: 0 }));
  };

  if (loading) return <div className="p-4 text-gray-500 text-center">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-800 font-bold text-white">Messages</div>
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
              {unreadCounts[conv.id] > 0 && (
                <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                  {unreadCounts[conv.id]}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}