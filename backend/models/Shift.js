import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Morning', 'Evening', 'Night']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true // in hours
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Shift', shiftSchema);
