import express from 'express';
import {
  initializeBloodBank,
  getBloodInventory,
  getBloodGroupInventory,
  addBloodDonation,
  useBlood,
  getEmergencyRequests,
  createEmergencyRequest, // Import the new controller function
  updateCriticalLevel,
  updateEmergencyRequestStatus,
} from '../controllers/bloodBankController.js';
import { protectUser } from '../middleware/userAuthMiddleware.js';
// import { protect, authorize } from '../middleware/authMiddleware.js'; // Assuming you have auth middleware

const router = express.Router();

// Public routes (or add protect middleware as needed)
router.get('/initialize', initializeBloodBank); // For initial setup, might be admin-only
router.get('/inventory', getBloodInventory);
router.get('/inventory/:bloodGroup', getBloodGroupInventory);

// Admin-only routes (assuming 'protect' and 'authorize' middleware exist)
router.get('/emergency-requests', getEmergencyRequests);
router.patch('/emergency-requests/:id/status', updateEmergencyRequestStatus);
// For simplicity, I'm not adding them here, but you should for a real app.
router.post('/donate', addBloodDonation);
router.post('/use', useBlood); // This route might also need protection
router.post('/emergency-request', protectUser, createEmergencyRequest); // Add this line for public emergency requests
router.patch('/critical-level/:bloodGroup', updateCriticalLevel);

export default router;