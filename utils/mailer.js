const nodemailer = require("nodemailer");
const { OTP_TTL_MINUTES } = require("./otp");

function isEmailConfigured() {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmailOtp({ to, otp }) {
  if (!isEmailConfigured()) {
    console.warn(
      "[OTP] Email not configured. Set SMTP_* env vars. Email OTP:",
      otp
    );
    return;
  }

  const transport = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transport.sendMail({
    from,
    to,
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });
}

module.exports = { sendEmailOtp, isEmailConfigured };
