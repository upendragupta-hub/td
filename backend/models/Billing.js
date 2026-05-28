import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientName: { type: String, required: true },
  invoiceId: { type: String, unique: true },
  department: { type: String },
  charges: {
    doctorFee: { type: Number, default: 0 },
    pharmacyFee: { type: Number, default: 0 },
    bedFee: { type: Number, default: 0 }
  },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Unpaid', 'Pending', 'Paid'], default: 'Unpaid' },
  paymentDate: { type: Date },
  razorpayPaymentId: { type: String }
}, { timestamps: true });

export default mongoose.model('Billing', billingSchema);
