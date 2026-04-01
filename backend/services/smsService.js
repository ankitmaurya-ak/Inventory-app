const twilio = require('twilio');

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (err) {
        console.error('[SMS] Failed to initialize Twilio client:', err.message);
    }
} else {
    console.log('[SMS] Twilio credentials missing from .env. SMS disabled.');
}

/**
 * Send an SMS to the store owner/user when an item is low stock.
 */
const sendLowStockSMS = async (item) => {
    if (!client || !process.env.TWILIO_PHONE_NUMBER || !process.env.OWNER_PHONE_NUMBER) {
        return false;
    }

    const messageBody = `🚨 INVENTORY ALERT\n` +
        `"${item.name}" is LOW ON STOCK.\n` +
        `Current Quantity: ${item.quantity}\n` +
        `Threshold: ${item.threshold}\n` +
        `Category: ${item.category || 'N/A'}`;

    try {
        await client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.OWNER_PHONE_NUMBER
        });
        console.log(`[SMS] ✅ Sent alert to owner for item: ${item.name}`);
        return true;
    } catch (err) {
        console.error(`[SMS] ❌ Failed to send SMS: ${err.message}`);
        return false;
    }
};

module.exports = { sendLowStockSMS };
