import express from 'express';
import {
  changeAdminPassword,
  getAdminProfile,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  updateAdminProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.route('/profile').get(protect, getAdminProfile).put(protect, updateAdminProfile);
router.put('/password', protect, changeAdminPassword);

export default router;
