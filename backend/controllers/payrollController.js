import Payroll from '../models/Payroll.js';
import Staff from '../models/Staff.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';

// Calculate payroll for staff
export const calculatePayroll = async (req, res) => {
  try {
    const { staffId, month, year } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Get attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      staffId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate working days and attendance
    const workingDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'Present').length;
    const lateDays = attendanceRecords.filter(a => a.status === 'Late').length;
    const halfDays = attendanceRecords.filter(a => a.status === 'Half Day').length;
    const onLeaveDays = attendanceRecords.filter(a => a.status === 'On Leave').length;
    const absentDays = attendanceRecords.filter(a => a.status === 'Absent').length;

    // Get approved leaves for the month
    const leaves = await Leave.find({
      staffId,
      status: 'Approved',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    const leaveDays = leaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);

    // Calculate salary
    const basicSalary = staff.baseSalary;
    const dailyRate = basicSalary / 30;

    // Earnings
    let totalEarnings = basicSalary;
    const overtime = staff.salary?.overtime || 0;
    const bonus = staff.salary?.bonus || 0;

    totalEarnings += overtime + bonus;

    // Deductions
    let totalDeductions = 0;

    // Late deduction (₹50 per late day or based on policy)
    const lateDeduction = lateDays * 50;

    // Unpaid leave deduction
    const unpaidLeaveDays = absentDays;
    const unpaidLeaveDeduction = unpaidLeaveDays * dailyRate;

    // Tax (assuming 10% for demo)
    const tax = Math.round(basicSalary * 0.1);

    totalDeductions = lateDeduction + unpaidLeaveDeduction + tax;

    // Net salary
    const netSalary = totalEarnings - totalDeductions;

    // Check if payroll already exists
    let payroll = await Payroll.findOne({ staffId, month, year });

    if (payroll) {
      payroll.basicSalary = basicSalary;
      payroll.earnings.overtime = overtime;
      payroll.earnings.bonus = bonus;
      payroll.deductions.lateDeduction = lateDeduction;
      payroll.deductions.unpaidLeave = unpaidLeaveDeduction;
      payroll.deductions.tax = tax;
      payroll.totalEarnings = totalEarnings;
      payroll.totalDeductions = totalDeductions;
      payroll.netSalary = netSalary;
      payroll.attendanceDays = presentDays + halfDays;
      payroll.workingDays = workingDays;
      payroll.leaveTaken = leaveDays;
      payroll.status = 'Calculated';
      payroll.updatedAt = Date.now();
    } else {
      payroll = new Payroll({
        staffId,
        month,
        year,
        basicSalary,
        earnings: {
          overtime,
          bonus
        },
        deductions: {
          lateDeduction,
          unpaidLeave: unpaidLeaveDeduction,
          tax
        },
        totalEarnings,
        totalDeductions,
        netSalary,
        attendanceDays: presentDays + halfDays,
        workingDays,
        leaveTaken: leaveDays,
        status: 'Calculated'
      });
    }

    const savedPayroll = await payroll.save();
    const populatedPayroll = await Payroll.findById(savedPayroll._id).populate('staffId');

    res.status(200).json({
      message: 'Payroll calculated successfully',
      payroll: populatedPayroll
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating payroll', error: error.message });
  }
};

// Get payroll records
export const getPayroll = async (req, res) => {
  try {
    const { staffId, month, year, status } = req.query;

    const query = {};
    if (staffId) query.staffId = staffId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    const payroll = await Payroll.find(query)
      .populate('staffId approvedBy')
      .sort({ year: -1, month: -1 });

    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll', error: error.message });
  }
};

// Get payroll for single staff
export const getStaffPayroll = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { year } = req.query;

    const query = { staffId };
    if (year) query.year = parseInt(year);

    const payroll = await Payroll.find(query)
      .populate('approvedBy')
      .sort({ year: -1, month: -1 });

    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff payroll', error: error.message });
  }
};

// Get payroll details
export const getPayrollDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id).populate('staffId approvedBy');
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll details', error: error.message });
  }
};

// Approve payroll
export const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    payroll.status = 'Approved';
    payroll.approvedBy = approvedBy;
    payroll.updatedAt = Date.now();

    const savedPayroll = await payroll.save();
    const populatedPayroll = await Payroll.findById(savedPayroll._id).populate('staffId approvedBy');

    res.status(200).json({
      message: 'Payroll approved successfully',
      payroll: populatedPayroll
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving payroll', error: error.message });
  }
};

// Mark payroll as paid
export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    payroll.status = 'Paid';
    payroll.paidDate = Date.now();
    payroll.paymentMethod = paymentMethod || 'Bank Transfer';
    payroll.updatedAt = Date.now();

    const savedPayroll = await payroll.save();
    const populatedPayroll = await Payroll.findById(savedPayroll._id).populate('staffId');

    res.status(200).json({
      message: 'Payroll marked as paid',
      payroll: populatedPayroll
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking payroll as paid', error: error.message });
  }
};

// Generate salary slip
export const generateSalarySlip = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id).populate('staffId');
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Format salary slip data
    const salarySlip = {
      employeeId: payroll.staffId._id,
      employeeName: payroll.staffId.name,
      role: payroll.staffId.role,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      earnings: {
        overtime: payroll.earnings.overtime || 0,
        bonus: payroll.earnings.bonus || 0,
        incentive: payroll.earnings.incentive || 0,
        total: payroll.totalEarnings
      },
      deductions: {
        unpaidLeave: payroll.deductions.unpaidLeave || 0,
        lateDeduction: payroll.deductions.lateDeduction || 0,
        tax: payroll.deductions.tax || 0,
        other: payroll.deductions.other || 0,
        total: payroll.totalDeductions
      },
      netSalary: payroll.netSalary,
      attendance: {
        workingDays: payroll.workingDays,
        presentDays: payroll.attendanceDays,
        leaveTaken: payroll.leaveTaken
      },
      status: payroll.status,
      paidDate: payroll.paidDate || null,
      paymentMethod: payroll.paymentMethod
    };

    res.status(200).json({
      message: 'Salary slip generated successfully',
      salarySlip
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating salary slip', error: error.message });
  }
};

// Calculate payroll for all staff in a month
export const calculateMonthlyPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    const allStaff = await Staff.find({ status: 'Active' });

    const results = [];
    for (const staff of allStaff) {
      // Get attendance for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendanceRecords = await Attendance.find({
        staffId: staff._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const workingDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'Present').length;
      const lateDays = attendanceRecords.filter(a => a.status === 'Late').length;
      const halfDays = attendanceRecords.filter(a => a.status === 'Half Day').length;
      const absentDays = attendanceRecords.filter(a => a.status === 'Absent').length;

      const basicSalary = staff.baseSalary;
      const dailyRate = basicSalary / 30;

      // Earnings
      let totalEarnings = basicSalary;
      const overtime = staff.salary?.overtime || 0;
      const bonus = staff.salary?.bonus || 0;
      totalEarnings += overtime + bonus;

      // Deductions
      const lateDeduction = lateDays * 50;
      const unpaidLeaveDeduction = absentDays * dailyRate;
      const tax = Math.round(basicSalary * 0.1);
      let totalDeductions = lateDeduction + unpaidLeaveDeduction + tax;

      const netSalary = totalEarnings - totalDeductions;

      // Create or update payroll
      let payroll = await Payroll.findOne({ staffId: staff._id, month, year });

      if (payroll) {
        payroll.basicSalary = basicSalary;
        payroll.earnings = { overtime, bonus };
        payroll.deductions = { lateDeduction, unpaidLeave: unpaidLeaveDeduction, tax };
        payroll.totalEarnings = totalEarnings;
        payroll.totalDeductions = totalDeductions;
        payroll.netSalary = netSalary;
        payroll.attendanceDays = presentDays + halfDays;
        payroll.workingDays = workingDays;
        payroll.status = 'Calculated';
      } else {
        payroll = new Payroll({
          staffId: staff._id,
          month,
          year,
          basicSalary,
          earnings: { overtime, bonus },
          deductions: { lateDeduction, unpaidLeave: unpaidLeaveDeduction, tax },
          totalEarnings,
          totalDeductions,
          netSalary,
          attendanceDays: presentDays + halfDays,
          workingDays,
          status: 'Calculated'
        });
      }

      await payroll.save();
      results.push({ staffId: staff._id, staffName: staff.name, netSalary });
    }

    res.status(200).json({
      message: 'Monthly payroll calculated for all active staff',
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating monthly payroll', error: error.message });
  }
};

// Get payroll statistics
export const getPayrollStats = async (req, res) => {
  try {
    const { month, year } = req.query;

    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query);

    const totalNetSalary = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalEarnings = payrolls.reduce((sum, p) => sum + p.totalEarnings, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.totalDeductions, 0);
    const averageSalary = payrolls.length > 0 ? totalNetSalary / payrolls.length : 0;
    const paid = payrolls.filter(p => p.status === 'Paid').length;
    const pending = payrolls.filter(p => p.status === 'Calculated' || p.status === 'Approved').length;

    res.status(200).json({
      totalPayrolls: payrolls.length,
      totalNetSalary,
      totalEarnings,
      totalDeductions,
      averageSalary,
      paid,
      pending
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll statistics', error: error.message });
  }
};
