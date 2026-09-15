import express from 'express';
import { getMessagesByRoom, createOrGetDirectChat } from '../controllers/chatController.js';

const router = express.Router();

router.get('/:room/messages', getMessagesByRoom);
router.post('/direct', createOrGetDirectChat);

export default router;
