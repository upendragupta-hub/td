import mongoose from 'mongoose';

const maintenanceReportSchema = new mongoose.Schema(
  {
    issueTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    currentKm: Number,
    locationAddress: {
      type: String,
      trim: true,
    },
    reportedBy: {
      type: String,
      trim: true,
    },
    reportedContact: {
      type: String,
      trim: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['New', 'Reviewed'],
      default: 'New',
    },
  },
  { _id: true },
);

const ambulanceSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['AC', 'Non-AC', 'ICU', 'Oxygen-supported'],
      default: 'AC',
    },
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, 'Driver contact is required'],
      trim: true,
    },
    currentStatus: {
      type: String,
      enum: ['Available', 'Busy', 'Maintenance'],
      default: 'Available',
    },
    shiftStatus: {
      type: String,
      enum: ['On Shift', 'Off Shift'],
      default: 'Off Shift',
    },
    location: {
      lat: Number,
      lng: Number,
      address: {
        type: String,
        trim: true,
      },
      updatedAt: Date,
    },
    equipment: {
      oxygenCylinder: { type: Boolean, default: false },
      defibrillator: { type: Boolean, default: false },
      ventilator: { type: Boolean, default: false },
      stretcher: { type: Boolean, default: true },
    },
    maintenance: {
      currentKm: { type: Number, default: 0 },
      serviceDueKm: { type: Number, default: 0 },
      lastServiceDate: Date,
    },
    maintenanceReports: {
      type: [maintenanceReportSchema],
      default: [],
    },
    billing: {
      pricingModel: {
        type: String,
        enum: ['distance', 'flat'],
        default: 'distance',
      },
      perKmRate: { type: Number, default: 45 },
      flatRate: { type: Number, default: 1200 },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Ambulance', ambulanceSchema);
