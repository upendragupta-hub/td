import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";
import { sendAppointmentConfirmationEmail } from "../utils/paymentNotifications.js";

// @desc    Create new appointment
// @route   POST /api/appointments
export const createAppointment = async (req, res) => {
  console.log("Appointment request received:", req.body);
  const { name, email, department, date, message, userId } = req.body;

  if (mongoose.connection.readyState !== 1) {
    console.warn("DB Not Connected - Printing appointment to console for manual tracking");
    console.warn("=========================================");
    console.warn("PATIENT NAME:", name);
    console.warn("EMAIL:", email);
    console.warn("DEPT:", department);
    console.warn("DATE:", date);
    console.warn("MSG:", message);
    console.warn("=========================================");

    return res.status(200).json({
      success: true,
      message: "Appointment request received (Running in Offline Mode)",
      offline: true,
      data: { name, email, department, date, message, createdAt: new Date() },
    });
  }

  try {
    const targetUserId = userId || req.userId;
    if (targetUserId) {
      const userAccount = await User.findById(targetUserId);
      if (userAccount && !userAccount.isActive) {
        return res.status(403).json({
          success: false,
          error: "Your account is currently suspended. Please contact hospital support for more information.",
        });
      }
    }

    const appointment = new Appointment({
      name,
      email,
      department,
      date,
      message,
      user: userId || req.userId,
    });

    const savedAppointment = await appointment.save();
    res.status(201).json({ success: true, data: savedAppointment });
  } catch (error) {
    console.error("Error saving appointment:", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get logged in user's appointments
// @route   GET /api/appointments/my-appointments
export const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.userId }).sort({ date: 1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Get all appointments (Admin)
// @route   GET /api/appointments/admin
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = status ? status.toLowerCase() : undefined;

    if (!normalizedStatus) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }

    const previousStatus = appointment.status;
    appointment.status = normalizedStatus;
    await appointment.save();

    let notifications = null;

    if (normalizedStatus === "confirmed") {
      const deptCharges = {
        cardiology: 500,
        pediatrics: 300,
        neurology: 450,
        "emergency care": 600,
        "general medicine": 200,
      };

      const deptKey = appointment.department ? appointment.department.toLowerCase() : "";
      const baseFee = deptCharges[deptKey] || 250;

      const existingBill = await Billing.findOne({ appointment: appointment._id });
      if (!existingBill) {
        await Billing.create({
          appointment: appointment._id,
          patientName: appointment.name,
          invoiceId: `INV-${appointment._id.toString().slice(-4).toUpperCase()}`,
          department: appointment.department,
          charges: {
            doctorFee: baseFee,
            pharmacyFee: 0,
            bedFee: 0,
          },
          totalAmount: baseFee,
          status: "Unpaid",
        });
        console.log(`Bill Generated for ${appointment.name}`);
      }

      if (previousStatus !== "confirmed") {
        const email = await sendAppointmentConfirmationEmail({ appointment }).catch((error) => ({
          sent: false,
          reason: error.message,
        }));

        notifications = { email };

        if (!email.sent) {
          console.warn("Appointment confirmation email status:", {
            appointmentId: appointment._id.toString(),
            email,
          });
        }
      }
    }

    res.status(200).json({ success: true, data: appointment, notifications });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
export const getAppointments = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: "Database is currently unavailable.",
    });
  }

  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
