import Billing from '../models/Billing.js';
import Appointment from '../models/Appointment.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { sendPaymentNotifications } from '../utils/paymentNotifications.js';
import {
  buildReceiptUrl,
  streamReceiptPdf,
  verifyReceiptAccessToken,
} from '../utils/receiptUtils.js';

dotenv.config();

let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
  } else {
    console.warn('Razorpay keys missing in .env - Payment features will be limited');
  }
} catch (error) {
  console.error('Razorpay Init Error:', error.message);
}

function getRequestUserId(req) {
  return req.userId || (req.user ? (req.user._id || req.user.id) : null);
}

async function loadInvoiceContext(invoiceId) {
  const invoice = await Billing.findById(invoiceId).populate({
    path: 'appointment',
    populate: {
      path: 'user',
      select: 'username email phone',
    },
  });

  if (!invoice) {
    return null;
  }

  const appointment = invoice.appointment || null;
  const user =
    appointment?.user &&
    typeof appointment.user === 'object' &&
    (appointment.user.email || appointment.user.username || appointment.user._id)
      ? appointment.user
      : null;

  return { invoice, appointment, user };
}

function ensureInvoiceOwnership({ appointment, userId }) {
  if (!appointment || !appointment.user || !userId) {
    return false;
  }

  const appointmentUserId =
    typeof appointment.user === 'object' && appointment.user !== null && appointment.user._id
      ? appointment.user._id.toString()
      : appointment.user.toString();

  return appointmentUserId === userId.toString();
}

async function notifyPaymentSuccess({ invoice, appointment, user }) {
  const receiptUrl = buildReceiptUrl({
    invoiceId: invoice._id.toString(),
    userId: user?._id?.toString(),
  });

  const notifications = await sendPaymentNotifications({
    invoice,
    patientEmail: user?.email || appointment?.email || null,
    patientPhone: user?.phone || null,
    patientName: user?.username || appointment?.name || invoice.patientName,
    receiptUrl,
  });

  if (!notifications.email?.sent || !notifications.whatsapp?.sent) {
    console.warn('Payment notification status:', {
      invoiceId: invoice.invoiceId,
      email: notifications.email,
      whatsapp: notifications.whatsapp,
    });
  }

  return notifications;
}

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Billing.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Billing.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const context = await loadInvoiceContext(req.params.id);

    if (!context) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { invoice, appointment, user } = context;
    const wasPaid = invoice.status === 'Paid';

    invoice.status = status;
    invoice.paymentDate = status === 'Paid' ? invoice.paymentDate || new Date() : null;
    await invoice.save();

    let notifications = null;
    if (status === 'Paid' && !wasPaid) {
      notifications = await notifyPaymentSuccess({ invoice, appointment, user });
    }

    res.status(200).json({ success: true, data: invoice, notifications });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getUserInvoices = async (req, res) => {
  try {
    const userId = getRequestUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const userAppointments = await Appointment.find({ user: userId }).select('_id');

    if (!userAppointments || userAppointments.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const appointmentIds = userAppointments.map((app) => app._id);
    const invoices = await Billing.find({ appointment: { $in: appointmentIds } }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error('Detailed Error in getUserInvoices:', error);
    res.status(500).json({ success: false, error: 'Server error fetching invoices' });
  }
};

export const createPaymentOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ success: false, error: 'Payment gateway not configured' });
    }

    const userId = getRequestUserId(req);
    const context = await loadInvoiceContext(req.params.id);

    if (!context) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { invoice, appointment } = context;

    if (!ensureInvoiceOwnership({ appointment, userId })) {
      return res.status(403).json({ success: false, error: 'Not authorized to pay this invoice' });
    }

    const options = {
      amount: invoice.totalAmount * 100,
      currency: 'INR',
      receipt: invoice.invoiceId,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ success: false, error: 'Could not create payment order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    const context = await loadInvoiceContext(invoiceId);
    if (!context) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { invoice, appointment, user } = context;

    if (!ensureInvoiceOwnership({ appointment, userId })) {
      return res.status(403).json({ success: false, error: 'Not authorized to pay this invoice' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, error: 'Invoice is already paid' });
    }

    invoice.status = 'Paid';
    invoice.paymentDate = new Date();
    invoice.razorpayPaymentId = razorpay_payment_id;
    await invoice.save();

    const notifications = await notifyPaymentSuccess({ invoice, appointment, user });

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      data: invoice,
      notifications,
    });
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const downloadReceipt = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    const context = await loadInvoiceContext(req.params.id);

    if (!context) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { invoice, appointment } = context;

    if (!ensureInvoiceOwnership({ appointment, userId })) {
      return res.status(403).json({ success: false, error: 'Not authorized to download this receipt' });
    }

    if (invoice.status !== 'Paid') {
      return res.status(400).json({ success: false, error: 'Receipt can only be downloaded for paid invoices.' });
    }

    streamReceiptPdf(invoice, res);
  } catch (error) {
    console.error('Error in downloadReceipt:', error);
    res.status(500).json({ success: false, error: 'Server error generating receipt' });
  }
};

export const downloadPublicReceipt = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Receipt token is required' });
    }

    const decoded = verifyReceiptAccessToken(token);
    if (decoded.type !== 'receipt' || decoded.invoiceId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Invalid receipt token' });
    }

    const context = await loadInvoiceContext(req.params.id);
    if (!context) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { invoice, appointment } = context;

    if (decoded.userId && !ensureInvoiceOwnership({ appointment, userId: decoded.userId })) {
      return res.status(403).json({ success: false, error: 'Receipt token does not match this invoice' });
    }

    if (invoice.status !== 'Paid') {
      return res.status(400).json({ success: false, error: 'Receipt can only be downloaded for paid invoices.' });
    }

    streamReceiptPdf(invoice, res);
  } catch (error) {
    console.error('Error in downloadPublicReceipt:', error);
    res.status(401).json({ success: false, error: 'Invalid or expired receipt token' });
  }
};
