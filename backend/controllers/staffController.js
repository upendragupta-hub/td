import Staff from '../models/Staff.js';

export const getOverviewStats = async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments();
    const activeStaff = await Staff.countDocuments({ status: 'Active' });
    const inactiveStaff = await Staff.countDocuments({ status: 'Inactive' });

    const staffByRole = await Staff.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      totalStaff,
      activeStaff,
      inactiveStaff,
      staffByRole
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all staff
export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate('shiftId');
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get staff statistics (for Reports)
export const getStaffStats = async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments();
    const activeStaff = await Staff.countDocuments({ status: 'Active' });
    const staffByRole = await Staff.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    res.status(200).json({ totalStaff, activeStaff, inactiveStaff: totalStaff - activeStaff, staffByRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new staff
export const createStaff = async (req, res) => {
  try {
    const newStaff = new Staff(req.body);
    await newStaff.save();
    res.status(201).json({ message: 'Staff created successfully', staff: newStaff });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update staff details
export const updateStaff = async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStaff) return res.status(404).json({ message: 'Staff not found' });
    res.status(200).json({ message: 'Staff updated successfully', staff: updatedStaff });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get staff by ID
export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('shiftId');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get staff by role
export const getStaffByRole = async (req, res) => {
  try {
    const staff = await Staff.find({ role: req.params.role });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Salary Structure
export const updateSalary = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, { $set: { "salary": req.body } }, { new: true });
    res.status(200).json({ message: 'Salary updated', staff });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Terminate Staff (Soft delete)
export const deleteStaff = async (req, res) => {
  try {
    await Staff.findByIdAndUpdate(req.params.id, { status: 'Terminated' });
    res.status(200).json({ message: 'Staff terminated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};