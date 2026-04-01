const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { query } = require('../config/database');

const getEmailConfig = async () => {
  const dbSettings = await query('SELECT key, value FROM settings WHERE key IN ($1, $2)', ['email_user', 'email_pass']);
  const settings = {};
  dbSettings.rows.forEach(r => { settings[r.key] = r.value; });

  return {
    fromEmail: settings.email_user || process.env.EMAIL_FROM || process.env.EMAIL_USER,
    smtpPassword: settings.email_pass || process.env.EMAIL_PASS,
    resendApiKey: process.env.RESEND_API_KEY,
  };
};

/**
 * Send a low-stock supplier email.
 */
const sendLowStockEmail = async (item) => {
  if (!item.supplier_email) {
    console.log(`[Email] Skipped - no supplier email for item: ${item.name}`);
    return false;
  }

  const { fromEmail, smtpPassword, resendApiKey } = await getEmailConfig();

  if (!fromEmail) {
    console.log('[Email] Skipped - no sender email configured.');
    return false;
  }

  const mailOptions = {
    from: `Inventory System <${fromEmail}>`,
    to: item.supplier_email,
    subject: `Low Stock Request - ${item.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #e53e3e;">Low Stock Alert</h2>
        <p>Dear ${item.supplier_name || 'Supplier'},</p>
        <p>Our inventory system has detected <strong>critically low stock</strong> for the following item:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background:#f7fafc;">
            <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Item Name</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${item.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Category</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${item.category || 'N/A'}</td>
          </tr>
          <tr style="background:#f7fafc;">
            <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Current Quantity</td>
            <td style="padding: 8px 12px; color:#e53e3e; font-weight: bold; border: 1px solid #e2e8f0;">${item.quantity} units</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Minimum Threshold</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${item.threshold} units</td>
          </tr>
          <tr style="background:#f7fafc;">
            <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Storage Location</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${item.location || 'N/A'}</td>
          </tr>
        </table>
        <p>Please arrange a resupply at your earliest convenience.</p>
        <p style="color: #718096; font-size: 12px; margin-top: 24px;">
          This is an automated alert from your Inventory Management System.<br/>
          Sent at: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  };

  try {
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send(mailOptions);
      console.log(`[Email] Sent via Resend to ${item.supplier_email} for item: ${item.name}`);
      return true;
    }

    if (!smtpPassword) {
      console.log('[Email] Skipped - no Resend API key or SMTP password configured.');
      return false;
    }

    const dynamicTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: { user: fromEmail, pass: smtpPassword },
    });

    await dynamicTransporter.sendMail(mailOptions);
    console.log(`[Email] Sent low-stock alert to ${item.supplier_email} for item: ${item.name}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send email: ${err.message}`);
    return false;
  }
};

module.exports = { sendLowStockEmail };