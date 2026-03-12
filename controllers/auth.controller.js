const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
    generateOtp,
    hashOtp,
    getOtpExpiry,
    isExpired,
} = require("../utils/otp");
const { sendEmailOtp } = require("../utils/mailer");
const { sendSmsOtp } = require("../utils/sms");

async function register(req, res) {
    try {
        const { username, email, password, phone } = req.body;

        if (!username || !email || !password || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const normalizedPhone = String(phone).trim();

        const existing = await userModel.findOne({
            $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
        });
        if (existing) {
            return res.status(409).json({ message: "Email or phone already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const emailOtp = generateOtp();
        const phoneOtp = generateOtp();
        const otpExpiresAt = getOtpExpiry();

        const user = await userModel.create({
            username: username,
            email: normalizedEmail,
            phone: normalizedPhone,
            password: hashedPassword,
            emailOtpHash: hashOtp(emailOtp),
            phoneOtpHash: hashOtp(phoneOtp),
            otpExpiresAt: otpExpiresAt
        });

        await Promise.allSettled([
            sendEmailOtp({ to: normalizedEmail, otp: emailOtp }),
            sendSmsOtp({ to: normalizedPhone, otp: phoneOtp }),
        ]);

        return res.status(201).json({
            message: "Registration successful. OTP sent to email and phone.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            }
        });
    } catch (error) {
        console.error("Registration Error:", error);
        if (error && error.code === 11000) {
            return res.status(409).json({ message: "Email or phone already in use" });
        }
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }
        
        // 1. Find user
        const user = await userModel.findOne({ email: String(email).toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. Require verification
        if (!user.isEmailVerified || !user.isPhoneVerified) {
            return res.status(403).json({
                message: "Please verify your email and phone before logging in"
            });
        }

        // 4. Generate Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        // 5. Send Cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone
            },
            token: token
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

async function verifyOtp(req, res) {
    try {
        const { email, phone, emailOtp, phoneOtp } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ message: "Email and phone are required" });
        }

        const user = await userModel.findOne({
            email: String(email).toLowerCase().trim(),
            phone: String(phone).trim()
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (isExpired(user.otpExpiresAt)) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        if (!user.isEmailVerified) {
            if (!emailOtp) {
                return res.status(400).json({ message: "Email OTP is required" });
            }
            if (hashOtp(emailOtp) !== user.emailOtpHash) {
                return res.status(400).json({ message: "Invalid email OTP" });
            }
            user.isEmailVerified = true;
            user.emailOtpHash = undefined;
        }

        if (!user.isPhoneVerified) {
            if (!phoneOtp) {
                return res.status(400).json({ message: "Phone OTP is required" });
            }
            if (hashOtp(phoneOtp) !== user.phoneOtpHash) {
                return res.status(400).json({ message: "Invalid phone OTP" });
            }
            user.isPhoneVerified = true;
            user.phoneOtpHash = undefined;
        }

        if (user.isEmailVerified && user.isPhoneVerified) {
            user.otpExpiresAt = undefined;
        }

        await user.save();

        return res.status(200).json({
            message: "Verification successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            }
        });
    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

async function resendOtp(req, res) {
    try {
        const { email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ message: "Email and phone are required" });
        }

        const user = await userModel.findOne({
            email: String(email).toLowerCase().trim(),
            phone: String(phone).trim()
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isEmailVerified && user.isPhoneVerified) {
            return res.status(200).json({ message: "Account already verified" });
        }

        const emailOtp = user.isEmailVerified ? null : generateOtp();
        const phoneOtp = user.isPhoneVerified ? null : generateOtp();

        if (emailOtp) user.emailOtpHash = hashOtp(emailOtp);
        if (phoneOtp) user.phoneOtpHash = hashOtp(phoneOtp);
        user.otpExpiresAt = getOtpExpiry();

        await user.save();

        await Promise.allSettled([
            emailOtp ? sendEmailOtp({ to: user.email, otp: emailOtp }) : Promise.resolve(),
            phoneOtp ? sendSmsOtp({ to: user.phone, otp: phoneOtp }) : Promise.resolve(),
        ]);

        return res.status(200).json({ message: "OTP resent" });
    } catch (error) {
        console.error("OTP Resend Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = { register, login, verifyOtp, resendOtp };
