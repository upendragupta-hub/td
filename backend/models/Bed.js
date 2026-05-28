import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: [true, 'Bed number is required'],
    unique: true,
    trim: true
  },
  ward: {
    type: String,
    required: [true, 'Ward assignment is required'],
    enum: ['ICU', 'General Ward', 'Emergency', 'Pediatrics', 'Surgery', 'Maternity']
  },
  status: {
    type: String,
    default: 'Available',
    enum: ['Available', 'Occupied', 'Maintenance']
  },
  type: {
    type: String,
    default: 'Standard',
    enum: ['Standard', 'Electronic', 'ICU Specialized']
  }
}, {
  timestamps: true
});

export default mongoose.model('Bed', bedSchema);