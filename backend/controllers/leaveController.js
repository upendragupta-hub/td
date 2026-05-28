import Leave from '../models/Leave.js';
import Staff from '../models/Staff.js';
import Attendance from '../models/Attendance.js';

// Apply for leave
export const applyLeave = async (req, res) => {
  try {
    const { staffId, leaveType, startDate, endDate, reason, documents } = req.body;

    // Validate staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays <= 0) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const newLeave = new Leave({
      staffId,
      leaveType,
      startDate: start,
      endDate: end,
      numberOfDays,
      reason,
      documents: documents || []
    });

    const savedLeave = await newLeave.save();
    const populatedLeave = await Leave.findById(savedLeave._id).populate('staffId');

    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave: populatedLeave
    });
  } catch (error) {
    res.status(500).json({ message: 'Error applying for leave', error: error.message });
  }
};

// Get all leave requests
export const getAllLeaves = async (req, res) => {
  try {
    const { status, staffId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (staffId) query.staffId = staffId;

    const leaves = await Leave.find(query)
      .populate('staffId approvedBy')
      .sort({ createdAt: -1 });

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves', error: error.message });
  }
};

// Get leave for specific staff
export const getStaffLeaves = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status } = req.query;

    const query = { staffId };
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('approvedBy')
      .sort({ createdAt: -1 });

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff leaves', error: error.message });
  }
};

// Get leave details
export const getLeaveDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id).populate('staffId approvedBy');
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.status(200).json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave details', error: error.message });
  }
};

// Approve leave
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending leaves can be approved' });
    }

    leave.status = 'Approved';
    leave.approvedBy = approvedBy;
    leave.approvalDate = Date.now();

    // Mark attendance as 'On Leave' for the leave period
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const attendanceDate = new Date(d);
      attendanceDate.setHours(0, 0, 0, 0);

      let attendance = await Attendance.findOne({
        staffId: leave.staffId,
        date: {
          $gte: attendanceDate,
          $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!attendance) {
        attendance = new Attendance({
          staffId: leave.staffId,
          date: attendanceDate,
          status: 'On Leave'
        });
      } else {
        attendance.status = 'On Leave';
      }

      await attendance.save();
    }

    const savedLeave = await leave.save();
    const populatedLeave = await Leave.findById(savedLeave._id).populate('staffId approvedBy');

    res.status(200).json({
      message: 'Leave approved successfully',
      leave: populatedLeave
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving leave', error: error.message });
  }
};

// Reject leave
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, approvedBy } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending leaves can be rejected' });
    }

    leave.status = 'Rejected';
    leave.rejectionReason = rejectionReason;
    leave.approvedBy = approvedBy;
    leave.approvalDate = Date.now();

    const savedLeave = await leave.save();
    const populatedLeave = await Leave.findById(savedLeave._id).populate('staffId approvedBy');

    res.status(200).json({
      message: 'Leave rejected successfully',
      leave: populatedLeave
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting leave', error: error.message });
  }
};

// Get leave statistics
export const getLeaveStats = async (req, res) => {
  try {
    const { staffId, year } = req.query;

    const query = {};
    if (staffId) query.staffId = staffId;
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query.startDate = { $gte: startDate };
      query.endDate = { $lte: endDate };
    }

    const stats = await Leave.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$numberOfDays' }
        }
      }
    ]);

    const approvedCount = await Leave.countDocuments({ ...query, status: 'Approved' });
    const pendingCount = await Leave.countDocuments({ ...query, status: 'Pending' });
    const rejectedCount = await Leave.countDocuments({ ...query, status: 'Rejected' });

    res.status(200).json({
      byType: stats,
      statusCounts: {
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave statistics', error: error.message });
  }
};
