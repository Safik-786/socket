import express from 'express';
import { createGroup, getUserGroups, addMember, removeMember, updateGroup, deleteGroup } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/user/:userId', protect, getUserGroups);
router.put('/:groupId', protect, updateGroup);
router.delete('/:groupId', protect, deleteGroup);
router.post('/:groupId/members', protect, addMember);
router.delete('/:groupId/members/:userId', protect, removeMember);

export default router;
