import { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useDirectMessages';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import InvitationMessage from './InvitationMessage';

export default function ChatWindow({ conversationId, recipient }) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sending } = useMessages(conversationId, recipient?.id);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    try {
      await sendMessage(recipient?.id, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  if (!recipient && !conversationId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a conversation to start messaging.
      </div>
    );
  }

  const recipientName = recipient?.display_name || recipient?.handle || 'Unknown';

  return (
    <div className="bg-[#151922] rounded-xl border border-gray-800 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="text-white font-bold">{recipientName}</div>
        <div className="text-gray-500 text-xs">Direct message • Messages expire after 2 days</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-gray-500 text-center">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">No messages yet. Say hello!</div>
        ) : (
          messages.map(msg => {
            // System message with invitation actions
            if (msg.is_system && msg.invitation_id) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <InvitationMessage
                    message={msg}
                    invitationId={msg.invitation_id}
                    actionData={msg.action_data}
                  />
                </div>
              );
            }

            // Normal message
            const isMe = msg.sender_id === user.id;
            const isTemp = msg.id?.startsWith('temp-');
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                  {msg.message}
                  <div className="text-[10px] opacity-70 mt-1 text-right flex items-center justify-end gap-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && (
                      <span className="ml-1">
                        {isTemp ? (
                          <i className="fas fa-clock text-gray-400"></i>
                        ) : msg.is_read ? (
                          <i className="fas fa-check-double text-green-400"></i>
                        ) : (
                          <i className="fas fa-check text-gray-400"></i>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-gray-800 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Type a message..."
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}