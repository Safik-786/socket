import express from 'express';
import { getMessagesByRoom, createOrGetDirectChat } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:room/messages', protect, getMessagesByRoom);
router.post('/direct', protect, createOrGetDirectChat);

export default router;
