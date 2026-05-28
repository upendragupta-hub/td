import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Doctor', 'Nurse', 'Ward Boy', 'Receptionist', 'Lab Technician', 'Pharmacist'],
    required: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  salary: {
    fixed: {
      type: Number,
      default: 0
    },
    overtime: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    }
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  documents: {
    aadhar: String,
    pan: String,
    qualifications: [String]
  },
  profileImage: {
    type: String,
    default: null
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

export default mongoose.model('Staff', staffSchema);
