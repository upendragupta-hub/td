import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkInTime: Date,
  checkOutTime: Date,
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'],
    default: 'Present'
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  notes: String
});

// Unique index per staff per day
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);