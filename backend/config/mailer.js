import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure nodemailer transporter
// Use explicit host and port for better reliability on cloud platforms (Render)
console.log('[MAILER] Initializing with user:', process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'MISSING');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Higher timeouts for cloud stability
  connectionTimeout: 40000,
  greetingTimeout: 30000,
  socketTimeout: 40000,
  // Enable debug logging for Render logs
  debug: true,
  logger: true,
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('[MAILER] Connection failed:', error.message);
  } else {
    console.log('[MAILER] ✅ Server is ready to send emails');
  }
});

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code to send
 * @returns {Promise}
 */
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your AIMS Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">AIMS Portal - Login Verification</h2>
            
            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="color: #555; font-size: 16px; margin-bottom: 30px;">
              Use the following One-Time Password (OTP) to complete your login:
            </p>
            
            <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <p style="font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px;">
                ${otp}
              </p>
            </div>
            
            <p style="color: #ff6b6b; font-size: 14px; margin-bottom: 20px;">
              ⚠️ <strong>This OTP will expire in 10 minutes.</strong>
            </p>
            
            <p style="color: #888; font-size: 14px; margin-bottom: 20px;">
              If you did not request this OTP, please ignore this email. Your account is safe.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #888; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[MAILER] ✅ OTP sent successfully to', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[MAILER] ❌ Error sending OTP:', error.message);
    throw error;
  }
};

export default transporter;
