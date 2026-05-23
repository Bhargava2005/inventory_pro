import nodemailer from 'nodemailer';

/**
 * Send an email using SMTP or log to console as fallback in development
 * @param {Object} options - Email options (to, subject, text, html)
 */
export const sendEmail = async (options) => {
  const isSmtpConfigured = 
    process.env.EMAIL_HOST && 
    process.env.EMAIL_USER && 
    process.env.EMAIL_PASS;

  if (!isSmtpConfigured) {
    // Elegant Terminal Fallback Logger
    console.log('\n┌──────────────────────────────────────────────────────────┐');
    console.log('│ 📬  DEVELOPMENT EMAIL SIMULATION:                        │');
    console.log(`│ TO:      ${options.to.padEnd(46)} │`);
    console.log(`│ SUBJECT: ${options.subject.padEnd(46)} │`);
    console.log('├──────────────────────────────────────────────────────────┤');
    
    // Extract OTP if present in the text
    const otpMatch = options.text.match(/\b\d{6}\b/);
    if (otpMatch) {
      console.log('│                                                          │');
      console.log(`│   YOUR 6-DIGIT EMAIL VERIFICATION OTP IS:                │`);
      console.log(`│   👉  \x1b[1m\x1b[36m${otpMatch[0]}\x1b[0m\x1b[22m                                             │`);
      console.log('│                                                          │');
    } else {
      const lines = options.text.split('\n').filter(l => l.trim().length > 0);
      lines.forEach(line => {
        console.log(`│ ${line.substring(0, 54).padEnd(56)} │`);
      });
    }
    console.log('└──────────────────────────────────────────────────────────┘\n');
    return { success: true, simulated: true };
  }

  // Create real Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Inventory Pro" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('🚀 Verification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
};
