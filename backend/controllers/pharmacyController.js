import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import Billing from '../models/Billing.js';
import Appointment from '../models/Appointment.js';
import { getSocketServer } from '../utils/socketServer.js';

export const getStock = async (req, res) => {
  try {
    const stock = await Medicine.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: stock.length, data: stock });
  } catch (error) {
    console.error('Error fetching medicine stock:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getExpiringSoon = async (req, res) => {
  try {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 30);

    const medicines = await Medicine.find({ expiryDate: { $lte: cutoff } }).sort({ expiryDate: 1 });
    res.status(200).json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    console.error('Error fetching expiring medicines:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getLowStock = async (req, res) => {
  try {
    const medicines = await Medicine.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } }).sort({ quantity: 1 });
    res.status(200).json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    console.error('Error fetching low stock medicines:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const addMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    console.error('Error adding medicine:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!medicine) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }
    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    console.error('Error updating medicine:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'pending' }).sort({ prescribedAt: -1 });
    res.status(200).json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const payload = {
      patientName: req.body.patientName,
      patientEmail: req.body.patientEmail,
      doctorName: req.body.doctorName,
      notes: req.body.notes,
      medicines: (req.body.medicines || []).map((med) => ({
        medicine: med.medicineId,
        name: med.name,
        quantity: med.quantity,
        instructions: med.instructions,
        price: med.price,
      })),
    };

    // Handle appointmentId and invoiceId - only set if valid ObjectId
    if (req.body.appointmentId && mongoose.Types.ObjectId.isValid(req.body.appointmentId)) {
      payload.appointmentId = req.body.appointmentId;
    }
    if (req.body.invoiceId && mongoose.Types.ObjectId.isValid(req.body.invoiceId)) {
      payload.invoiceId = req.body.invoiceId;
    }

    const prescription = await Prescription.create(payload);
    const io = getSocketServer();
    io?.emit('new-prescription', prescription);

    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    console.error('Error creating prescription:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const dispatchPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }
    if (prescription.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Prescription is not pending' });
    }

    const session = await Medicine.startSession();
    session.startTransaction();

    try {
      let totalMedicineCost = 0;
      for (const medItem of prescription.medicines) {
        if (!medItem.medicine) {
          throw new Error(`Missing medicine ID for ${medItem.name}`);
        }

        const medicine = await Medicine.findById(medItem.medicine).session(session);
        if (!medicine) {
          throw new Error(`Medicine not found: ${medItem.name}`);
        }
        if (medicine.quantity < medItem.quantity) {
          throw new Error(`Insufficient stock for ${medicine.name}. Available ${medicine.quantity}`);
        }

        medicine.quantity -= medItem.quantity;
        await medicine.save({ session });
        totalMedicineCost += medItem.price * medItem.quantity;
      }

      prescription.status = 'fulfilled';
      await prescription.save({ session });

      const updateResults = {};
      if (req.body.invoiceId || prescription.invoiceId) {
        const invoiceId = req.body.invoiceId || prescription.invoiceId;
        const invoice = await Billing.findById(invoiceId).session(session);
        if (invoice) {
          invoice.charges.pharmacyFee = (invoice.charges.pharmacyFee || 0) + totalMedicineCost;
          invoice.totalAmount = (invoice.totalAmount || 0) + totalMedicineCost;
          await invoice.save({ session });
          updateResults.invoice = invoice;
        }
      } else if (prescription.appointmentId) {
        const invoice = await Billing.findOne({ appointment: prescription.appointmentId }).session(session);
        if (invoice) {
          invoice.charges.pharmacyFee = (invoice.charges.pharmacyFee || 0) + totalMedicineCost;
          invoice.totalAmount = (invoice.totalAmount || 0) + totalMedicineCost;
          await invoice.save({ session });
          updateResults.invoice = invoice;
        }
      }

      await session.commitTransaction();
      session.endSession();

      const io = getSocketServer();
      io?.emit('prescription-updated', prescription);

      res.status(200).json({ success: true, data: prescription, billing: updateResults.invoice || null });
    } catch (innerError) {
      await session.abortTransaction();
      session.endSession();
      throw innerError;
    }
  } catch (error) {
    console.error('Error dispatching prescription:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};
