import express from 'express';
import * as leaveController from '../controllers/leaveController.js';

const router = express.Router();

// Apply for leave
router.post('/', leaveController.applyLeave);

// Get all leaves
router.get('/', leaveController.getAllLeaves);

// Get leave statistics
router.get('/stats/overview', leaveController.getLeaveStats);

// Get leaves for specific staff
router.get('/staff/:staffId', leaveController.getStaffLeaves);

// Get leave details
router.get('/:id', leaveController.getLeaveDetails);

// Approve leave
router.put('/:id/approve', leaveController.approveLeave);

// Reject leave
router.put('/:id/reject', leaveController.rejectLeave);

export default router;
