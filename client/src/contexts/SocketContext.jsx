import React, { createContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (userId) {
      // Connect to socket when userId is available
      socketService.connect(userId);
      setSocket(socketService.getSocket());
    }

    return () => {
      // Clean up on unmount
      socketService.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
