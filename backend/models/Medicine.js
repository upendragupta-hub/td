import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Tablet', 'Syrup', 'Injection', 'Ointment', 'Other'],
    default: 'Other',
  },
  manufacturer: { type: String, trim: true },
  batchNumber: { type: String, trim: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  reorderLevel: { type: Number, required: true, min: 0, default: 10 },
  unit: { type: String, trim: true, default: 'Units' },
  price: { type: Number, required: true, min: 0, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

medicineSchema.virtual('status').get(function () {
  if (this.quantity <= 0) return 'Out of Stock';
  if (this.quantity <= this.reorderLevel) return 'Low Stock';
  return 'In Stock';
});

medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

export default mongoose.model('Medicine', medicineSchema);