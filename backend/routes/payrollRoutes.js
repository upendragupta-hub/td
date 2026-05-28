import express from 'express';
import * as payrollController from '../controllers/payrollController.js';

const router = express.Router();

// Calculate payroll for a staff member
router.post('/calculate', payrollController.calculatePayroll);

// Calculate payroll for all staff in a month
router.post('/calculate-all', payrollController.calculateMonthlyPayroll);

// Get payroll records
router.get('/', payrollController.getPayroll);

// Get payroll statistics
router.get('/stats/overview', payrollController.getPayrollStats);

// Get payroll for specific staff
router.get('/staff/:staffId', payrollController.getStaffPayroll);

// Get payroll details
router.get('/:id', payrollController.getPayrollDetails);

// Approve payroll
router.put('/:id/approve', payrollController.approvePayroll);

// Mark payroll as paid
router.put('/:id/mark-paid', payrollController.markAsPaid);

// Generate salary slip
router.get('/:id/salary-slip', payrollController.generateSalarySlip);

export default router;
