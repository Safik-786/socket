import Group from '../models/Group.js';
import User from '../models/User.js';
import { getIO } from '../sockets/index.js';

export const createGroup = async (req, res) => {
  try {
    const { name, adminId } = req.body;
    
    // Check if group name is globally unique
    const existingGroup = await Group.findOne({ name, isDirectMessage: false });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists. Please choose a different name.' });
    }

    const group = new Group({
      name,
      admin: adminId,
      members: [adminId] // Admin is automatically a member
    });
    await group.save();
    
    // Populate admin info before returning
    await group.populate('admin members', 'username isOnline');
    
    // Automatically make the admin join the new group socket room
    const io = getIO();
    io.emit('new_group_added', { userId: adminId, group });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await Group.find({ members: userId }).populate('admin members', 'username isOnline');
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { username, adminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Check if requester is admin
    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    const userToAdd = await User.findOne({ username });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    if (group.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    group.members.push(userToAdd._id);
    await group.save();
    await group.populate('admin members', 'username isOnline');

    // Notify the user so their client joins the room
    const io = getIO();
    io.emit('new_group_added', { userId: userToAdd._id, group });
    
    // Notify the room that a new member joined
    io.to(group._id.toString()).emit('member_added', { groupId: group._id, user: userToAdd });

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { adminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    if (group.admin.toString() === userId) {
      return res.status(400).json({ message: 'Admin cannot be removed' });
    }

    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();
    await group.populate('admin members', 'username isOnline');

    const io = getIO();
    // Notify the removed user
    io.emit('removed_from_group', { userId, groupId });
    // Notify the room
    io.to(group._id.toString()).emit('member_removed', { groupId, userId });

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, adminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: 'Only admin can update the group' });
    }

    // Check if new name is unique
    const existingGroup = await Group.findOne({ name, isDirectMessage: false, _id: { $ne: groupId } });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists. Please choose a different name.' });
    }

    group.name = name;
    await group.save();
    await group.populate('admin members', 'username isOnline');

    // Broadcast to room
    const io = getIO();
    io.to(group._id.toString()).emit('group_updated', group);

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body; // Sent in request body for DELETE

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: 'Only admin can delete the group' });
    }

    await group.deleteOne();

    // Broadcast delete event before users leave the room so they can clean up
    const io = getIO();
    io.to(groupId).emit('group_deleted', { groupId });

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
