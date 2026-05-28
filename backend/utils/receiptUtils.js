import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);
  return numericAmount.toFixed(2);
}

function writeReceiptPdf(doc, invoice) {
  const appointmentDate = invoice.appointment?.date
    ? new Date(invoice.appointment.date).toLocaleDateString()
    : 'N/A';

  doc.fontSize(25).text('WeCare Hospital - Payment Receipt', { align: 'center' });
  doc.moveDown();

  doc.fontSize(16).text(`Invoice ID: ${invoice.invoiceId}`);
  doc.text(`Patient Name: ${invoice.patientName}`);
  doc.text(`Department: ${invoice.department || 'N/A'}`);
  doc.text(`Appointment Date: ${appointmentDate}`);
  doc.text(`Payment Status: ${invoice.status}`);

  if (invoice.paymentDate) {
    doc.text(`Payment Date: ${new Date(invoice.paymentDate).toLocaleDateString()}`);
  }

  if (invoice.razorpayPaymentId) {
    doc.text(`Transaction ID: ${invoice.razorpayPaymentId}`);
  }

  doc.moveDown();

  doc.fontSize(18).text('Charges:', { underline: true });
  doc.fontSize(14).text(`  Doctor Fee: INR ${formatCurrency(invoice.charges?.doctorFee)}`);
  doc.text(`  Pharmacy Fee: INR ${formatCurrency(invoice.charges?.pharmacyFee)}`);
  doc.text(`  Bed Fee: INR ${formatCurrency(invoice.charges?.bedFee)}`);
  doc.moveDown();

  doc.fontSize(20).text(`Total Amount: INR ${formatCurrency(invoice.totalAmount)}`, { align: 'right' });
  doc.moveDown();

  doc.fontSize(12).text('Thank you for choosing WeCare Hospital.', { align: 'center' });
}

export function getReceiptFilename(invoice) {
  return `receipt_${invoice.invoiceId}.pdf`;
}

export function streamReceiptPdf(invoice, res) {
  const filename = getReceiptFilename(invoice);
  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);
  writeReceiptPdf(doc, invoice);
  doc.end();
}

export function createReceiptAccessToken({ invoiceId, userId }) {
  return jwt.sign(
    {
      type: 'receipt',
      invoiceId,
      userId: userId || null,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.RECEIPT_LINK_EXPIRES_IN || '30d',
    }
  );
}

export function verifyReceiptAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function getBackendPublicUrl() {
  return process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.BACKEND_PORT || 5001}`;
}

export function buildReceiptUrl({ invoiceId, userId }) {
  const token = createReceiptAccessToken({ invoiceId, userId });
  const encodedToken = encodeURIComponent(token);

  return `${getBackendPublicUrl()}/api/billing/public-receipt/${invoiceId}?token=${encodedToken}`;
}
