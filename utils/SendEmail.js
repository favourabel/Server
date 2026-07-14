const { createTransporter } = require('../config/Email');
const logger = require('./Logger');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - HTML content
 * @param {String} options.text - Plain text content (optional)
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`📧 Email sent to ${options.to}`, {
      messageId: info.messageId,
      subject: options.subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error('❌ Email sending failed:', {
      error: error.message,
      to: options.to,
    });

    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;