import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      trim: true,
    },
    lat: Number,
    lng: Number,
  },
  { _id: false },
);

const billingSchema = new mongoose.Schema(
  {
    pricingModel: {
      type: String,
      enum: ['distance', 'flat'],
      default: 'distance',
    },
    estimatedAmount: Number,
    finalAmount: Number,
    addedToMainBill: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const tripLogSchema = new mongoose.Schema(
  {
    tripStartTime: Date,
    tripEndTime: Date,
    fuelLitres: Number,
    distanceKm: Number,
  },
  { _id: false },
);

const ambulanceRequestSchema = new mongoose.Schema(
  {
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      trim: true,
    },
    patientName: {
      type: String,
      trim: true,
    },
    patientPhone: {
      type: String,
      trim: true,
    },
    patientPhoneNormalized: {
      type: String,
      trim: true,
      index: true,
    },
    patientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    pickupLocation: {
      type: pointSchema,
      required: true,
    },
    destination: {
      type: new mongoose.Schema(
        {
          name: {
            type: String,
            trim: true,
          },
          address: {
            type: String,
            trim: true,
          },
          type: {
            type: String,
            enum: ['Hospital', 'Out-station'],
            default: 'Hospital',
          },
          lat: Number,
          lng: Number,
        },
        { _id: false },
      ),
      required: true,
    },
    urgencyLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'Critical'],
      default: 'Moderate',
    },
    assignedDriver: {
      type: String,
      trim: true,
    },
    assignedAmbulance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance',
    },
    requestStatus: {
      type: String,
      enum: ['Pending', 'Assigned', 'Picked up', 'Dropped', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    etaMinutes: Number,
    patientDistanceKm: Number,
    billing: billingSchema,
    logs: tripLogSchema,
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('AmbulanceRequest', ambulanceRequestSchema);
