import Shift from '../models/Shift.js';

export const getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shifts', error: error.message });
  }
};

export const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shift', error: error.message });
  }
};

export const createShift = async (req, res) => {
  try {
    const { name, startTime, endTime, duration } = req.body;
    const existing = await Shift.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Shift name already exists' });
    }
    const shift = new Shift({ name, startTime, endTime, duration });
    const savedShift = await shift.save();
    res.status(201).json({ message: 'Shift created successfully', shift: savedShift });
  } catch (error) {
    res.status(500).json({ message: 'Error creating shift', error: error.message });
  }
};

export const updateShift = async (req, res) => {
  try {
    const updates = req.body;
    const shift = await Shift.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    res.status(200).json({ message: 'Shift updated successfully', shift });
  } catch (error) {
    res.status(500).json({ message: 'Error updating shift', error: error.message });
  }
};

export const deleteShift = async (req, res) => {
  try {
    const deletedShift = await Shift.findByIdAndDelete(req.params.id);
    if (!deletedShift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shift', error: error.message });
  }
};
