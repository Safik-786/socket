import User from '../../models/User.js';

export const handleUserEvents = (io, socket) => {
  socket.on('typing', (data) => {
    const { room, isTyping } = data;
    // Broadcast to others in the room that this user is typing
    socket.to(room).emit('user_typing', { userId: socket.data.userId, isTyping });
  });

  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.data.userId) {
      try {
        await User.findByIdAndUpdate(socket.data.userId, { 
          isOnline: false, 
          lastSeen: Date.now() 
        });
        // Optionally notify all connected clients that user is offline
        io.emit('user_status_change', { userId: socket.data.userId, isOnline: false });
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    }
  });
};
