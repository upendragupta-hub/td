import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  earnings: {
    overtime: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    incentive: {
      type: Number,
      default: 0
    }
  },
  deductions: {
    unpaidLeave: {
      type: Number,
      default: 0
    },
    lateDeduction: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  totalEarnings: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  attendanceDays: {
    type: Number,
    default: 0
  },
  workingDays: {
    type: Number,
    default: 0
  },
  leaveTaken: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Calculated', 'Approved', 'Paid'],
    default: 'Draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null
  },
  paidDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Check', 'Cash'],
    default: 'Bank Transfer'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
payrollSchema.index({ staffId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);
