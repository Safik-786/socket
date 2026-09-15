import express from 'express';
import { loginUser, getAllUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/', protect, getAllUsers);

export default router;
