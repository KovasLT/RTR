import { createContext, useContext, useState, useCallback } from 'react';
import ChatModal from './ChatModal';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recipient, setRecipient] = useState(null);

  const openChatWith = useCallback((user) => {
    setRecipient(user);
    setIsOpen(true);
  }, []);

  const closeChat = () => {
    setIsOpen(false);
    setRecipient(null);
  };

  return (
    <ChatContext.Provider value={{ openChatWith, closeChat }}>
      {children}
      <ChatModal isOpen={isOpen} onClose={closeChat} initialRecipient={recipient} />
    </ChatContext.Provider>
  );
};