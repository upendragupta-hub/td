import mongoose from 'mongoose';

const emergencyBloodRequestSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      required: true,
    },
    units: {
      type: Number,
      required: true,
      min: 1,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientEmail: {
      type: String,
      required: [true, "Contact email is required"],
      lowercase: true,
    },
    patientAge: {
      type: Number,
    },
    department: {
      type: String,
      required: true,
    },
    urgency: {
      type: String,
      enum: ['Critical', 'High', 'Medium'],
      default: 'High',
    },
    description: {
      type: String,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Changed from Admin to User to support patient requests
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('EmergencyBloodRequest', emergencyBloodRequestSchema);
