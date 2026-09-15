import React, { createContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      // Connect to socket when token is available
      socketService.connect(token);
      setSocket(socketService.getSocket());
    }

    return () => {
      // Clean up on unmount
      socketService.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
