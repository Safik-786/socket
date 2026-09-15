import express from 'express';
import { loginUser, getAllUsers } from '../controllers/userController.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/', getAllUsers);

export default router;
