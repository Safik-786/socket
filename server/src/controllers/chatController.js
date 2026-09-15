import Message from '../models/Message.js';
import Group from '../models/Group.js';
import { getIO } from '../sockets/index.js';

export const getMessagesByRoom = async (req, res) => {
  try {
    const { room } = req.params;
    const messages = await Message.find({ room }).populate('sender', 'username isOnline lastSeen').sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrGetDirectChat = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;

    // Check if a direct message group already exists between these exactly two users
    let group = await Group.findOne({
      isDirectMessage: true,
      members: { $all: [userId, targetUserId], $size: 2 }
    }).populate('members', 'username isOnline');

    if (group) {
      return res.status(200).json(group);
    }

    // Otherwise, create a new direct message group
    group = new Group({
      name: `DM_${userId}_${targetUserId}`, // Name doesn't matter much for DM
      admin: userId, // Required by schema, but irrelevant for DMs
      members: [userId, targetUserId],
      isDirectMessage: true
    });

    await group.save();
    await group.populate('members', 'username isOnline');

    // Notify both users to join the socket room
    const io = getIO();
    io.emit('new_group_added', { userId: userId, group });
    io.emit('new_group_added', { userId: targetUserId, group });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
