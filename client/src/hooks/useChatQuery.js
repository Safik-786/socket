import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMessages } from '../services/api';
import { useSocket } from './useSocket';

export const useChatQuery = (room) => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  // 1. Fetch initial messages using TanStack Query
  const { data: messages = [], isLoading, isError } = useQuery({
    queryKey: ['messages', room],
    queryFn: () => fetchMessages(room),
    enabled: !!room,
  });

  // 2. Setup Socket.io listeners to update the TanStack Query cache in real-time
  useEffect(() => {
    if (!socket || !room) return;

    const handleReceiveMessage = (newMessage) => {
      // Optimistically update the cache with the new message
      queryClient.setQueryData(['messages', room], (oldMessages) => {
        if (!oldMessages) return [newMessage];
        // Ensure we don't add duplicates (sometimes events fire twice in React StrictMode)
        if (oldMessages.find(m => m._id === newMessage._id)) return oldMessages;
        return [...oldMessages, newMessage];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    // Cleanup listener on unmount
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, room, queryClient]);

  return { messages, isLoading, isError };
};
