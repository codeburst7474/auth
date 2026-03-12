const crypto = require("crypto");

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function getOtpExpiry() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

function isExpired(expiresAt) {
  if (!expiresAt) return true;
  return Date.now() > new Date(expiresAt).getTime();
}

module.exports = {
  OTP_TTL_MINUTES,
  generateOtp,
  hashOtp,
  getOtpExpiry,
  isExpired,
};
