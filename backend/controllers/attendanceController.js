import Attendance from '../models/Attendance.js';
import Staff from '../models/Staff.js';
import Shift from '../models/Shift.js';

export const checkIn = async (req, res) => {
  try {
    const { staffId } = req.body;
    const staff = await Staff.findById(staffId).populate('shiftId');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const now = new Date();
    const today = new Date().setHours(0, 0, 0, 0);

    // Check if shift is late (Example: 15 mins grace period)
    let status = 'Present';
    if (staff.shiftId) {
      const [shiftHour, shiftMin] = staff.shiftId.startTime.split(':');
      const shiftTime = new Date().setHours(shiftHour, shiftMin, 0, 0);
      if (now > shiftTime + (15 * 60 * 1000)) { // 15 mins late
        status = 'Late';
      }
    }

    const attendance = new Attendance({
      staffId,
      date: today,
      checkInTime: now,
      status
    });

    await attendance.save();
    res.status(201).json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkOut = async (req, res) => {
  try {
    const { staffId } = req.body;
    const today = new Date().setHours(0, 0, 0, 0);
    
    const record = await Attendance.findOne({ staffId, date: today });
    if (!record) return res.status(404).json({ message: 'No check-in found for today' });

    record.checkOutTime = new Date();
    const diff = record.checkOutTime - record.checkInTime;
    record.hoursWorked = (diff / (1000 * 60 * 60)).toFixed(2);
    
    await record.save();
    res.status(200).json({ message: 'Checked out successfully', attendance: record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Stats for Reports
export const getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const summary = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0)
          }
        }
      },
      {
        $group: {
          _id: "$staffId",
          present: { $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          onLeave: { $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] } }
        }
      }
    ]);
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all attendance records
export const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().populate('staffId').sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark attendance manually (for Admin)
export const markAttendance = async (req, res) => {
  try {
    const { staffId, date, status, notes } = req.body;
    const attendance = await Attendance.findOneAndUpdate(
      { staffId, date: new Date(date).setHours(0,0,0,0) },
      { staffId, date, status, notes },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Attendance marked', attendance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get summary for reporting
export const getAttendanceSummary = async (req, res) => {
  // Redirect to existing aggregation logic
  return getMonthlySummary(req, res);
};

// Get attendance for specific staff
export const getStaffAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ staffId: req.params.staffId }).sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};