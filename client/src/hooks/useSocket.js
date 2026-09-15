import { useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';

export const useSocket = () => {
  const socket = useContext(SocketContext);
  
  // It might be null initially before connection is established
  return socket;
};
