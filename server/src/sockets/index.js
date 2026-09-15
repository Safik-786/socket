import { Server } from 'socket.io';
import { handleMessageEvents } from './handlers/messageHandler.js';
import { handleRoomEvents } from './handlers/roomHandler.js';
import { handleUserEvents } from './handlers/userHandler.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

let io;

export const initSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust based on your frontend URL in production
      methods: ['GET', 'POST']
    }
  });

  // Optional: Socket middleware for authentication
  io.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error('Authentication error: userId required'));
    }
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach userId to the socket object for later use
      socket.data.userId = userId;
      
      // Update online status
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('user_status_change', { userId, isOnline: true });
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`New socket connected: ${socket.id} (User: ${socket.data.userId})`);

    // Auto-join all groups this user is a member of
    try {
      const userGroups = await Group.find({ members: socket.data.userId });
      userGroups.forEach(group => {
        socket.join(group._id.toString());
        console.log(`Socket ${socket.id} auto-joined group: ${group.name}`);
      });
    } catch (error) {
      console.error('Error auto-joining groups:', error);
    }

    // Join personal room for direct events (like invites)
    socket.join(socket.data.userId);

    // Register event handlers
    handleMessageEvents(io, socket);
    handleRoomEvents(io, socket);
    handleUserEvents(io, socket);
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
