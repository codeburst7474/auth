let twilioClient = null;

function isSmsConfigured() {
  return (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM
  );
}

function getTwilioClient() {
  if (!isSmsConfigured()) return null;
  if (twilioClient) return twilioClient;
  try {
    const twilio = require("twilio");
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    return twilioClient;
  } catch (error) {
    console.warn(
      "[OTP] Twilio not installed. Run npm install twilio to enable SMS."
    );
    return null;
  }
}

async function sendSmsOtp({ to, otp }) {
  const client = getTwilioClient();
  if (!client) {
    console.warn(
      "[OTP] SMS not configured. Set TWILIO_* env vars. SMS OTP:",
      otp
    );
    return;
  }

  await client.messages.create({
    body: `Your verification code is ${otp}.`,
    from: process.env.TWILIO_FROM,
    to,
  });
}

module.exports = { sendSmsOtp, isSmsConfigured };
