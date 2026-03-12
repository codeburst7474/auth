const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    emailOtpHash: {
        type: String
    },
    phoneOtpHash: {
        type: String
    },
    otpExpiresAt: {
        type: Date
    }
}, { timestamps: true });

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
