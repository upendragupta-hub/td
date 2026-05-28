import express from 'express';
import { 
  getInvoices, 
  getInvoiceById, 
  updateInvoiceStatus,
  getUserInvoices,      // 1. Inhe import karein
  createPaymentOrder, 
  verifyPayment,
  downloadPublicReceipt,
  downloadReceipt // Import the new function
} from '../controllers/billingController.js';
import { protect } from '../middleware/authMiddleware.js'; 
import { protectUser } from '../middleware/userAuthMiddleware.js'; // User auth middleware import karein

const router = express.Router();

// Public/Admin routes
router.get('/all', protect, getInvoices); // Admin ke liye

// --- User Specific Routes ---
// Dhyaan dein: Ye route '/:id' se UPAR hona chahiye, 
// warna Express 'my-invoices' ko ek ID samajh lega.
router.get('/my-invoices', protectUser, getUserInvoices); 

// Razorpay Routes
router.post('/:id/create-order', protectUser, createPaymentOrder);
router.post('/verify-payment', protectUser, verifyPayment);

// New route for downloading receipt
router.get('/public-receipt/:id', downloadPublicReceipt);
router.get('/:id/receipt', protectUser, downloadReceipt);

// Specific bill routes
router.get('/:id', getInvoiceById);
router.patch('/:id/status', protect, updateInvoiceStatus);

export default router;
