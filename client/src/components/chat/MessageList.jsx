import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useChatQuery } from '../../hooks/useChatQuery';

const MessageList = ({ room, currentUserId }) => {
  const { messages, isLoading, isError } = useChatQuery(room);

  if (isLoading) return <div className="flex-1 flex items-center justify-center p-4">Loading messages...</div>;
  if (isError) return <div className="flex-1 flex items-center justify-center p-4 text-red-500">Error loading messages.</div>;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
      {messages.length === 0 ? (
        <div className="text-center text-primary-700 my-4">No messages yet. Be the first to say hi!</div>
      ) : (
        messages.map((msg, index) => {
          const isOwn = msg.sender?._id === currentUserId || msg.sender === currentUserId;
          return (
            <div key={msg._id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-sm ${
                isOwn ? 'bg-primary-500 text-white rounded-br-none' : 'bg-surface text-primary-900 rounded-bl-none border border-primary-200'
              }`}>
                {!isOwn && <p className="text-xs font-semibold text-primary-600 mb-1">{msg.sender?.username || 'Unknown'}</p>}
                <p className="text-sm">{msg.content}</p>
                <span className={`text-[10px] block mt-1 ${isOwn ? 'text-primary-100' : 'text-primary-700'}`}>
                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageList;
