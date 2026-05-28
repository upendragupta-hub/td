import Bed from '../models/Bed.js';
import mongoose from 'mongoose'; // Import mongoose to check connection state

// @desc    Get all beds (Available, Occupied, Maintenance)
// @route   GET /api/beds
export const getBeds = async (req, res) => {
  const fallbackBeds = [
    { bedNumber: 'B-101', ward: 'ICU', status: 'Available', type: 'Electronic' },
    { bedNumber: 'B-102', ward: 'ICU', status: 'Occupied', type: 'Electronic' },
    { bedNumber: 'G-201', ward: 'General Ward', status: 'Available', type: 'Standard' },
    { bedNumber: 'E-001', ward: 'Emergency', status: 'Maintenance', type: 'Standard' },
  ];

  // Check if DB is connected
  if (mongoose.connection.readyState !== 1) {
    console.warn("⚠️ DB Not Connected - Serving fallback bed data");
    return res.status(200).json({ 
      success: true, 
      count: fallbackBeds.length, 
      data: fallbackBeds,
      dbStatus: "disconnected",
      message: "Using fallback data because database is offline"
    });
  }

  try {
    let beds = await Bed.find().sort({ bedNumber: 1 });

    // If no beds found, seed the database
    if (beds.length === 0) {
      console.log("🌱 Seeding beds into database...");
      await Bed.insertMany(fallbackBeds);
      beds = await Bed.find().sort({ bedNumber: 1 });
    }

    res.status(200).json({ success: true, count: beds.length, data: beds });
  } catch (error) {
    console.error("❌ Error in getBeds:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server Error fetching beds",
      data: fallbackBeds, // Still provide fallback data for UI to render something
      message: "Database error, using fallback data"
    });
  }
};

// @desc    Create new bed
// @route   POST /api/beds
export const createBed = async (req, res) => {
  try {
    const bed = await Bed.create(req.body);
    res.status(201).json({ success: true, data: bed });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Bed number already exists' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update bed status (e.g., for patient discharge)
// @route   PATCH /api/beds/:id/status
// This is a more specific update than the general PUT /api/beds/:id
export const updateBedStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bed = await Bed.findByIdAndUpdate(req.params.id, { status }, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!bed) {
      return res.status(404).json({ success: false, error: 'Bed not found' });
    }
    res.status(200).json({ success: true, data: bed });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update bed
// @route   PUT /api/beds/:id
export const updateBed = async (req, res) => {
  try {
    const { status, ...otherUpdates } = req.body;
    let query = { _id: req.params.id };

    // Concurrency check: If trying to set status to 'Occupied', ensure it's currently 'Available' or 'Maintenance'
    // This prevents two admins from assigning the same 'Available' bed.
    // If a bed is in 'Maintenance', it can also be moved to 'Occupied' if the maintenance is complete.
    if (status === 'Occupied') {
      query.status = { $in: ['Available', 'Maintenance'] }; // Only update if current status is Available or Maintenance
    }

    const bed = await Bed.findOneAndUpdate(query, { status, ...otherUpdates }, {
      returnDocument: 'after', // Return the updated document
      runValidators: true, // Run Mongoose validators on the update
      // You might also consider `rawResult: true` to check if the document was actually found and modified
    });

    if (!bed) {
      // जाँचें कि क्या बेड वास्तव में मौजूद नहीं है या सिर्फ स्टेटस मैच नहीं हुआ
      const checkExist = await Bed.findById(req.params.id);
      if (!checkExist) {
        return res.status(404).json({ success: false, error: 'Bed not found' });
      }
      return res.status(409).json({ 
        success: false, 
        error: 'Concurrency Conflict: Bed might have been occupied by another admin or is in maintenance.' 
      });
    }

    res.status(200).json({ success: true, data: bed });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// @desc    Delete bed
// @route   DELETE /api/beds/:id
export const deleteBed = async (req, res) => {
  try {
    const bed = await Bed.findByIdAndDelete(req.params.id);

    if (!bed) {
      return res.status(404).json({ success: false, error: 'Bed not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};