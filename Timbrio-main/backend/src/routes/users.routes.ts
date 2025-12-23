import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  disableUser,
  enableUser,
  deleteUser,
  getUserStats,
} from '../controllers/users.controller';
import { authenticate, requireManager, requireAdmin } from '../middleware/auth';

const router = Router();

// Routes manager/admin
router.get('/', authenticate, requireManager, getAllUsers);
router.get('/stats', authenticate, requireManager, getUserStats);
router.get('/:id', authenticate, getUserById);

// Routes admin only
router.post('/', authenticate, requireAdmin, createUser);
router.put('/:id', authenticate, updateUser);
router.put('/:id/disable', authenticate, requireAdmin, disableUser);
router.put('/:id/enable', authenticate, requireAdmin, enableUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
