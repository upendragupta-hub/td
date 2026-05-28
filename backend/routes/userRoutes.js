import express from 'express';
import {
  changeUserPassword,
  deleteUser,
  getUserProfile,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
  updateUserStatus,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { protectUser } from '../middleware/userAuthMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.route('/profile').get(protectUser, getUserProfile).put(protectUser, updateUserProfile);
router.put('/password', protectUser, changeUserPassword);

router.route('/').get(protect, restrictTo(['admin']), getUsers);
router.route('/:id/status').patch(protect, restrictTo(['admin']), updateUserStatus);
router.route('/:id').delete(protect, restrictTo(['admin']), deleteUser);

export default router;
