export const handleRoomEvents = (io, socket) => {
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
    
    // Optionally notify others in the room
    socket.to(roomName).emit('user_joined', { userId: socket.data.userId, socketId: socket.id });
  });

  socket.on('leave_room', (roomName) => {
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
    
    // Optionally notify others
    socket.to(roomName).emit('user_left', { userId: socket.data.userId, socketId: socket.id });
  });
};
