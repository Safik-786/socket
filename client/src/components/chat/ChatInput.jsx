import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Send } from 'lucide-react';

const ChatInput = ({ room, currentUserId }) => {
  const [content, setContent] = useState('');
  const socket = useSocket();

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim() || !socket) return;

    socket.emit('send_message', {
      senderId: currentUserId,
      room,
      content: content.trim(),
    });

    setContent('');
  };

  return (
    <form onSubmit={handleSend} className="p-4 bg-surface border-t border-primary-200 flex gap-2 items-center">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 bg-background border-transparent text-primary-900 placeholder:text-primary-400 focus:bg-surface focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-full px-4 py-2 transition-all outline-none"
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={18} />
      </button>
    </form>
  );
};

export default ChatInput;
