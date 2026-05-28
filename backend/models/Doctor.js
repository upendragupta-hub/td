import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Doctor name is required"],
  },
  specialty: {
    type: String,
    required: [true, "Specialty is required"],
  },
  image: {
    type: String,
    required: [true, "Image URL is required"],
  },
  email: {
    type: String,
    required: [true, "Doctor email is required"],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  phone: {
    type: String,
    required: [true, "Doctor phone is required"]
  },
  schedule: {
    type: String,
  },
  experience: {
    type: String,
  },
}, { timestamps: true });

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
