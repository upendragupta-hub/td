import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';

const router = express.Router();

// Check-in
router.post('/check-in', attendanceController.checkIn);

// Check-out
router.post('/check-out', attendanceController.checkOut);

// Get attendance records
router.get('/', attendanceController.getAttendance);

// Mark attendance manually
router.post('/mark', attendanceController.markAttendance);

// Get attendance summary
router.get('/summary/monthly', attendanceController.getAttendanceSummary);

// Get attendance for specific staff
router.get('/staff/:staffId', attendanceController.getStaffAttendance);

export default router;
