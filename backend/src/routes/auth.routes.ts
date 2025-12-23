import { Router } from 'express';
import {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Routes pubbliche
router.post('/login', login);
router.post('/register', register);

// Routes protette
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;
