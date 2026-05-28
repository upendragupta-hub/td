import nodemailer from 'nodemailer';

/**
 * Patient को ब्लड रिक्वेस्ट स्टेटस अपडेट भेजने के लिए सर्विस
 */
export const sendStatusUpdateEmail = async (email, username, status, bloodGroup, units, notes) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // .env से होस्ट
      port: process.env.EMAIL_PORT, // .env से पोर्ट
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail के लिए यहाँ App Password यूज़ करें
      },
    });

    const statusColor = status === 'Approved' ? '#10b981' : '#ef4444';
    const statusText = status === 'Approved' ? 'ACCEPTED' : 'CANCELLED';

    const mailOptions = {
      from: process.env.EMAIL_FROM, // .env से FROM एड्रेस
      to: email,
      subject: `Emergency Blood Request Update: ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2563eb; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">WeCare Hospital</h1>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <h3>Hello ${username},</h3>
            <p>Your emergency blood request has been reviewed by the hospital administration.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Blood Group:</strong> ${bloodGroup}</p>
              <p><strong>Required Units:</strong> ${units}</p>
              <p><strong>Final Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
            </div>

            ${notes ? `
            <p style="color: #64748b; font-weight: bold;">Admin Remarks:</p>
            <p style="background-color: #fffbeb; padding: 10px; border-left: 4px solid #f59e0b;">${notes}</p>
            ` : ''}

            <p>If your request was <strong>Approved</strong>, please visit the Blood Bank counter immediately with the patient's ID proof.</p>
            
            <p style="margin-top: 30px;">For any queries, contact our 24/7 coordinator at <strong>+1 (555) 999-0000</strong>.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              This is an automated message from the WeCare Management System.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Notification Email sent to ${email} (${status})`);
    return true;
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    return false;
  }
};