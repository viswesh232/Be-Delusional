const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, 
    
    // Handy: Support for two phone numbers for delivery reliability
    phoneNumber: { type: String, required: true },
    altPhoneNumber: { type: String },

    // Professional: Structured address for your ordering flow
    address: {
        doorNo: { type: String },
        colony: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: 'India' }
    },

    // Security: The "Judge" logic for roles
    role: { 
        type: String, 
        enum: ['customer', 'admin'], 
        default: 'customer' 
    },

    // Hidden admin accounts are still admins, but excluded from normal admin user listings
    hiddenAdmin: { type: Boolean },

    // Flow: Email Verification status
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    
    tokenVersion: { type: Number, default: 0 },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);