import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let cachedTransporter;

function buildWhatsappMessage({ invoice, patientName, receiptUrl }) {
  return [
    `Hello ${patientName || 'Patient'},`,
    `Your payment for invoice ${invoice.invoiceId} was successful.`,
    `Receipt link: ${receiptUrl}`,
    'Thank you for choosing WeCare Hospital.',
  ].join('\n');
}

function getMailTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    console.error('❌ Mail SMTP Configuration Missing:', {
      host: host ? '✓' : '✗ Missing',
      user: user ? '✓' : '✗ Missing',
      pass: pass ? '✓' : '✗ Missing',
      port,
    });
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    console.log('✅ Email transporter initialized for:', user);
  }

  return cachedTransporter;
}

function normalizePhoneNumber(phone) {
  if (!phone) return null;

  let normalized = String(phone).trim().replace(/[^\d+]/g, '');

  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (!normalized.startsWith('+')) {
    if (/^\d{10}$/.test(normalized)) {
      normalized = `+91${normalized}`;
    } else {
      normalized = `+${normalized}`;
    }
  }

  return /^\+\d{8,15}$/.test(normalized) ? normalized : null;
}

function buildWhatsappShareUrl({ phone, message }) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return null;

  const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
  return `https://wa.me/${phoneWithoutPlus}?text=${encodeURIComponent(message)}`;
}

async function sendReceiptEmail({ invoice, email, patientName, receiptUrl }) {
  const transporter = getMailTransporter();

  if (!transporter) {
    return { sent: false, reason: 'SMTP is not configured' };
  }

  if (!email) {
    return { sent: false, reason: 'Patient email is not available' };
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const subject = `Payment Receipt - Invoice ${invoice.invoiceId} | WeCare Hospital`;
  const text = [
    `Hello ${patientName || 'Patient'},`,
    '',
    `Your payment of INR ${invoice.totalAmount} was successful.`,
    `Invoice ID: ${invoice.invoiceId}`,
    `Receipt link: ${receiptUrl}`,
    '',
    'Thank you for choosing WeCare Hospital.',
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .header-subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; background-color: white; }
        .success-badge { background-color: #10b981; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
        .invoice-details { background-color: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .detail-label { color: #666; font-weight: 600; }
        .detail-value { color: #333; font-weight: bold; }
        .amount-box { background-color: #f0f4ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .amount-label { color: #666; font-size: 14px; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
        .btn:hover { background-color: #5568d3; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
        .contact-info { margin-top: 10px; font-size: 13px; }
        .divider { height: 1px; background-color: #ddd; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏥 WeCare Hospital</div>
          <div class="header-subtitle">Patient Care Excellence</div>
        </div>
        
        <div class="content">
          <div class="success-badge">✓ Payment Successful</div>
          
          <p>Hello <strong>${patientName || 'Valued Patient'},</strong></p>
          <p>Your payment has been successfully processed. Below are your payment details:</p>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Invoice ID:</span>
              <span class="detail-value">${invoice.invoiceId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Department:</span>
              <span class="detail-value">${invoice.department || 'General'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>
          
          <div class="amount-box">
            <div class="amount-label">Amount Paid</div>
            <div class="amount">INR ${invoice.totalAmount}</div>
          </div>
          
          <p>Your receipt is now ready for download. Click the button below to access it:</p>
          
          <div class="btn-container">
            <a href="${receiptUrl}" class="btn">📥 Download Receipt</a>
          </div>
          
          <div class="divider"></div>
          
          <p><strong>Receipt Details:</strong></p>
          <ul style="color: #555;">
            <li>Keep this receipt for your records</li>
            <li>You can download it anytime from your account</li>
            <li>For payment inquiries, contact our billing department</li>
          </ul>
          
          <p style="margin-top: 20px; color: #666;">Thank you for trusting WeCare Hospital with your healthcare needs. We appreciate your business!</p>
        </div>
        
        <div class="footer">
          <strong>WeCare Hospital</strong>
          <div class="contact-info">
            📞 Phone: +91 XXXX-XXXX-XXXX | 📧 Email: care@wecarehospital.com
          </div>
          <div class="contact-info">
            🏢 Address: Healthcare Complex, Medical City | Website: www.wecarehospital.com
          </div>
          <div style="margin-top: 15px; font-size: 11px; color: #999;">
            This is an automated message, please do not reply directly to this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html,
    });
    console.log('✅ Receipt email sent to:', email);
    return { sent: true, to: email };
  } catch (error) {
    console.error('❌ Receipt email failed:', error.message);
    return { sent: false, reason: error.message };
  }
}

export async function sendAppointmentConfirmationEmail({ appointment }) {
  const transporter = getMailTransporter();

  if (!transporter) {
    return { sent: false, reason: 'SMTP is not configured' };
  }

  if (!appointment?.email) {
    return { sent: false, reason: 'Patient email is not available' };
  }

  const appointmentDate = appointment.date
    ? new Date(appointment.date).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : 'To be announced';

  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
  const subject = `✓ Your Appointment is Confirmed | ${appointment.department} | WeCare Hospital`;
  const text = [
    `Hello ${appointment.name || 'Patient'},`,
    '',
    'Your appointment has been confirmed by WeCare Hospital.',
    `Department: ${appointment.department}`,
    `Date: ${appointmentDate}`,
    '',
    'Please arrive a little early and carry any relevant documents.',
    'Thank you for choosing WeCare Hospital.',
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .header-subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; background-color: white; }
        .confirmation-badge { background-color: #10b981; color: white; padding: 12px 24px; border-radius: 5px; display: inline-block; margin-bottom: 20px; font-weight: bold; font-size: 16px; }
        .appointment-card { background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #667eea; }
        .card-title { color: #667eea; font-weight: bold; font-size: 18px; margin-bottom: 15px; }
        .appointment-detail { display: flex; align-items: center; margin: 12px 0; padding: 10px; background-color: white; border-radius: 5px; }
        .detail-icon { font-size: 20px; margin-right: 15px; width: 30px; }
        .detail-content { flex: 1; }
        .detail-label { color: #999; font-size: 12px; text-transform: uppercase; }
        .detail-value { color: #333; font-weight: bold; font-size: 15px; }
        .instructions { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .instruction-title { color: #856404; font-weight: bold; margin-bottom: 10px; }
        .instruction-list { color: #856404; margin-left: 20px; }
        .instruction-list li { margin: 8px 0; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
        .btn:hover { background-color: #5568d3; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
        .contact-info { margin-top: 10px; font-size: 13px; }
        .divider { height: 1px; background-color: #ddd; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏥 WeCare Hospital</div>
          <div class="header-subtitle">Your Health, Our Priority</div>
        </div>
        
        <div class="content">
          <div class="confirmation-badge">✓ APPOINTMENT CONFIRMED</div>
          
          <p>Hello <strong>${appointment.name || 'Valued Patient'},</strong></p>
          <p>Great news! Your appointment has been successfully confirmed. We look forward to seeing you soon.</p>
          
          <div class="appointment-card">
            <div class="card-title">📋 Appointment Details</div>
            
            <div class="appointment-detail">
              <div class="detail-icon">🏥</div>
              <div class="detail-content">
                <div class="detail-label">Department</div>
                <div class="detail-value">${appointment.department}</div>
              </div>
            </div>
            
            <div class="appointment-detail">
              <div class="detail-icon">📅</div>
              <div class="detail-content">
                <div class="detail-label">Scheduled Date & Time</div>
                <div class="detail-value">${appointmentDate}</div>
              </div>
            </div>
            
            ${appointment.message ? `<div class="appointment-detail">
              <div class="detail-icon">📝</div>
              <div class="detail-content">
                <div class="detail-label">Notes</div>
                <div class="detail-value">${appointment.message}</div>
              </div>
            </div>` : ''}
          </div>
          
          <div class="instructions">
            <div class="instruction-title">📌 Important Instructions</div>
            <ul class="instruction-list">
              <li><strong>Arrive Early:</strong> Please arrive 10-15 minutes before your appointment</li>
              <li><strong>Required Documents:</strong> Bring a valid ID and any previous medical reports</li>
              <li><strong>Insurance:</strong> If insured, bring your insurance card</li>
              <li><strong>Emergency Contact:</strong> Keep an emergency contact number handy</li>
            </ul>
          </div>
          
          <p style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; border-left: 4px solid #0ea5e9;">
            <strong>❓ Need to Reschedule?</strong> If you need to change your appointment time, please contact us at least 24 hours in advance.
          </p>
          
          <div class="divider"></div>
          
          <p style="color: #666; font-size: 14px;">Thank you for choosing WeCare Hospital. If you have any questions or concerns, our customer support team is always ready to help.</p>
        </div>
        
        <div class="footer">
          <strong>WeCare Hospital</strong>
          <div class="contact-info">
            📞 Phone: +91 XXXX-XXXX-XXXX | 📧 Email: care@wecarehospital.com
          </div>
          <div class="contact-info">
            🏢 Address: Healthcare Complex, Medical City | Website: www.wecarehospital.com
          </div>
          <div style="margin-top: 15px; font-size: 11px; color: #999;">
            This is an automated message, please do not reply directly to this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to: appointment.email,
      subject,
      text,
      html,
    });
    console.log('✅ Appointment confirmation email sent to:', appointment.email);
    return { sent: true, to: appointment.email };
  } catch (error) {
    console.error('❌ Appointment confirmation email failed:', error.message);
    return { sent: false, reason: error.message };
  }
}

async function sendReceiptWhatsapp({ invoice, phone, patientName, receiptUrl }) {
  const messageBody = buildWhatsappMessage({ invoice, patientName, receiptUrl });
  const manualLink = buildWhatsappShareUrl({ phone, message: messageBody });
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    return { sent: false, reason: 'Patient phone is not available' };
  }

  if (!accountSid || !authToken || !whatsappFrom) {
    return {
      sent: false,
      reason: 'Twilio WhatsApp is not configured',
      link: manualLink,
      manualAvailable: Boolean(manualLink),
    };
  }

  const fromNumber = whatsappFrom.startsWith('whatsapp:')
    ? whatsappFrom
    : `whatsapp:${whatsappFrom}`;

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${normalizedPhone}`,
        From: fromNumber,
        Body: messageBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        sent: false,
        reason: `Twilio WhatsApp send failed: ${errorText}`,
        link: manualLink,
        manualAvailable: Boolean(manualLink),
      };
    }

    const payload = await response.json();
    return { sent: true, to: normalizedPhone, sid: payload.sid };
  } catch (error) {
    return {
      sent: false,
      reason: error.message,
      link: manualLink,
      manualAvailable: Boolean(manualLink),
    };
  }
}

export async function sendBloodEmergencyAlert({ bloodGroup, units, patientName, department, urgency, availableUnits }) {
  const transporter = getMailTransporter();
  const alertEmail = process.env.BLOOD_ALERT_EMAIL;

  const message = [
    `Emergency Blood Request received for ${bloodGroup}.`,
    `Units needed: ${units}.`,
    `Patient: ${patientName || 'Unknown'}.`,
    `Department: ${department}.`,
    `Urgency: ${urgency || 'High'}.`,
    `Available units: ${availableUnits}.`,
    '',
    'Please respond immediately to arrange donation or transfer.',
  ].join('\n');

  if (!transporter || !alertEmail) {
    console.warn('⚠️ Blood alert notification is not configured.');
    return {
      alertSent: false,
      reason: 'Blood alert email or SMTP configuration is missing',
      message,
    };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER,
      to: alertEmail,
      subject: `🚨 Emergency Blood Request: ${bloodGroup}`,
      text: message,
    });

    console.log('✅ Emergency blood alert sent to:', alertEmail);
    return { alertSent: true, to: alertEmail };
  } catch (error) {
    console.error('❌ Failed to send blood emergency alert:', error.message);
    return { alertSent: false, reason: error.message };
  }
}

export async function sendPaymentNotifications({ invoice, patientEmail, patientPhone, patientName, receiptUrl }) {
  const [emailResult, whatsappResult] = await Promise.all([
    sendReceiptEmail({ invoice, email: patientEmail, patientName, receiptUrl }).catch((error) => ({
      sent: false,
      reason: error.message,
    })),
    sendReceiptWhatsapp({ invoice, phone: patientPhone, patientName, receiptUrl }),
  ]);

  return {
    receiptUrl,
    email: emailResult,
    whatsapp: whatsappResult,
  };
}
