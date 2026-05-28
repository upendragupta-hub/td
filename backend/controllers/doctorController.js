import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";

// @desc    Get all doctors
// @route   GET /api/doctors
export const getDoctors = async (req, res) => {
  const fallbackDoctors = [
    { 
      name: 'Dr. Sarah Mitchell', 
      specialty: 'Chief Cardiologist',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      email: 'sarah.m@wecare.com',
      phone: '+1 555-0101',
      schedule: 'Mon-Wed 9AM-5PM',
      experience: '15+ Years'
    },
    { 
      name: 'Dr. James Wilson', 
      specialty: 'Senior Neurologist',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      email: 'j.wilson@wecare.com',
      phone: '+1 555-0102',
      schedule: 'Tue-Thu 10AM-6PM',
      experience: '12+ Years'
    },
    { 
      name: 'Dr. Emily Chen', 
      specialty: 'Pediatric Specialist',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      email: 'emily.chen@wecare.com',
      phone: '+1 555-0103',
      schedule: 'Mon-Fri 8AM-2PM',
      experience: '8+ Years'
    },
    { 
      name: 'Dr. Michael Brown', 
      specialty: 'Emergency Medicine',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      email: 'm.brown@wecare.com',
      phone: '+1 555-0104',
      schedule: 'Sat-Sun 24 Hours',
      experience: '10+ Years'
    },
  ];

  // Check if DB is connected
  if (mongoose.connection.readyState !== 1) {
    console.log("⚠️ DB Not Connected - Serving fallback doctor data");
    return res.status(200).json({ 
      success: true, 
      count: fallbackDoctors.length, 
      data: fallbackDoctors,
      dbStatus: "disconnected",
      message: "Using fallback data because database is offline"
    });
  }

  try {
    let doctors = await Doctor.find();
    
    // Seed data if empty
    if (doctors.length === 0) {
      console.log("🌱 Seeding doctors into database...");
      await Doctor.insertMany(fallbackDoctors);
      doctors = await Doctor.find();
    }

    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    console.error("❌ Error in getDoctors:", error);
    // Even if catch hits, return fallback
    res.status(200).json({ success: true, count: fallbackDoctors.length, data: fallbackDoctors, error: "Database error" });
  }
};

// @desc    Add a doctor (Admin)
// @route   POST /api/doctors
export const addDoctor = async (req, res) => {
  // Check if DB is connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      success: false, 
      error: "Database is currently unavailable." 
    });
  }

  try {
    const { name, specialty, image, experience, email, phone, schedule } = req.body;
    const doctor = await Doctor.create({ name, specialty, image, experience, email, phone, schedule });
    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update a doctor (Admin)
// @route   PUT /api/doctors/:id
export const updateDoctor = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: "Database is currently unavailable.",
    });
  }

  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a doctor (Admin)
// @route   DELETE /api/doctors/:id
export const deleteDoctor = async (req, res) => {
  // Check if DB is connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      success: false, 
      error: "Database is currently unavailable." 
    });
  }

  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
