import Message from '../../models/Message.js';

export const handleMessageEvents = (io, socket) => {
  // Listen for 'send_message' event from client
  socket.on('send_message', async (data) => {
    try {
      const { senderId, room, content } = data;
      
      // Save message to MongoDB
      const message = new Message({
        sender: senderId,
        room,
        content,
      });
      await message.save();

      // Populate sender info before emitting to clients
      await message.populate('sender', 'username isOnline');

      // Emit 'receive_message' to everyone in the room (including sender)
      io.to(room).emit('receive_message', message);
    } catch (error) {
      console.error('Error handling send_message:', error);
      // Emit error back to sender
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};
