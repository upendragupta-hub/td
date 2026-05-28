import express from 'express';
import * as staffController from '../controllers/staffController.js';

const router = express.Router();

// Get all staff
router.get('/', staffController.getAllStaff);

// Get staff statistics
router.get('/stats/overview', staffController.getStaffStats);

// Get staff by role
router.get('/role/:role', staffController.getStaffByRole);

// Get staff by ID
router.get('/:id', staffController.getStaffById);

// Create new staff
router.post('/', staffController.createStaff);

// Update staff
router.put('/:id', staffController.updateStaff);

// Update staff salary
router.put('/:id/salary', staffController.updateSalary);

// Delete staff (mark as terminated)
router.delete('/:id', staffController.deleteStaff);

export default router;
