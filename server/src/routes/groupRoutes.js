import express from 'express';
import { createGroup, getUserGroups, addMember, removeMember, updateGroup, deleteGroup } from '../controllers/groupController.js';

const router = express.Router();

router.post('/', createGroup);
router.get('/user/:userId', getUserGroups);
router.put('/:groupId', updateGroup);
router.delete('/:groupId', deleteGroup);
router.post('/:groupId/members', addMember);
router.delete('/:groupId/members/:userId', removeMember);

export default router;
