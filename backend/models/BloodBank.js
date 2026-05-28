import mongoose from 'mongoose';

const bloodBankSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      unique: true,
      required: true,
    },
    units: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    donorCount: {
      type: Number,
      default: 0,
    },
    criticalLevel: {
      type: Number,
      default: 5, // Alert when stock goes below this
    },
  },
  { timestamps: true }
);

// Auto-calculate lastUpdated on save
bloodBankSchema.pre('save', function () {
  this.lastUpdated = Date.now();
});

export default mongoose.model('BloodBank', bloodBankSchema);
