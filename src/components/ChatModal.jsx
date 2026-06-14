import { useState, useEffect } from 'react';
import MessageInbox from './MessageInbox';
import ChatWindow from './ChatWindow';

export default function ChatModal({ isOpen, onClose, initialRecipient }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(initialRecipient || null);

  useEffect(() => {
    if (initialRecipient) {
      setSelectedRecipient(initialRecipient);
      setSelectedConversation(null);
    }
  }, [initialRecipient]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedConversation(null);
      setSelectedRecipient(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f1219] rounded-xl border border-gray-800 w-[90vw] max-w-5xl h-[80vh] flex overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
          aria-label="Close chat"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
        <div className="flex w-full h-full">
          <div className="w-80 shrink-0 border-r border-gray-800">
            <MessageInbox
              onSelectConversation={(convId, otherUser) => {
                setSelectedConversation(convId);
                setSelectedRecipient(otherUser);
              }}
              selectedId={selectedConversation}
            />
          </div>
          <div className="flex-1">
            <ChatWindow
              conversationId={selectedConversation}
              recipient={selectedRecipient}
            />
          </div>
        </div>
      </div>
    </div>
  );
}