import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientName: { type: String, required: true, trim: true },
  patientEmail: { type: String, trim: true },
  doctorName: { type: String, trim: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing' },
  medicines: [
    {
      medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
      name: { type: String, required: true, trim: true },
      quantity: { type: Number, required: true, min: 1 },
      instructions: { type: String, trim: true },
      price: { type: Number, default: 0, min: 0 },
    },
  ],
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'fulfilled', 'cancelled'],
    default: 'pending',
  },
  prescribedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

export default mongoose.model('Prescription', prescriptionSchema);