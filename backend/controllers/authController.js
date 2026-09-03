const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/signup
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, altPhoneNumber, address } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password (Security Pillar)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create a unique Verification Token (Flow Pillar)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Create the User in MongoDB
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      altPhoneNumber,
      address, // This saves the nested DoorNo, Colony, City, etc.
      verificationToken
    });

    if (user) {
      // TODO: Send Email with Nodemailer here
      // The Professional Link: Sends them to a verification route we will build next
      // Point to the frontend verification page
      const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verifyUrl = `${clientUrl}/verify/${verificationToken}`;

      // Send verification email using the specialized utility
      await sendVerificationEmail(user.email, verifyUrl);

      return res.status(201).json({
        message: 'Signup successful. Please check your email to verify your account.',
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Find the user with this specific token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    // 2. Update the user: Verify them and remove the token
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // 3. Return success JSON
    return res.status(200).json({ message: 'Email verified successfully! You can now log in.' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });

    if (user) {
      // 2. Check if Email is Verified (Crucial Security Step)
      if (!user.isVerified) {
        return res.status(401).json({ message: "Please verify your email before logging in." });
      }

      // 3. Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // 4. Success! Send User Data + JWT Token
        res.json({
          _id: user._id,
          firstName: user.firstName,
          email: user.email,
          role: user.role, // This tells React if they are Admin or Customer
          token: generateToken(user._id, user.role),
        });
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.altPhoneNumber = req.body.altPhoneNumber || user.altPhoneNumber;

      if (req.body.address) {
        user.address = {
          doorNo: req.body.address.doorNo || user.address?.doorNo,
          colony: req.body.address.colony || user.address?.colony,
          city: req.body.address.city || user.address?.city,
          state: req.body.address.state || user.address?.state,
          pincode: req.body.address.pincode || user.address?.pincode,
          country: req.body.address.country || user.address?.country || 'India',
        };
      }

      const updatedUser = await user.save();
      res.json({ message: 'Profile updated successfully', user: updatedUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Security: don't reveal whether the email is registered or not
      return res.status(200).json({ message: 'If that email is registered, a password reset link has been sent.' });
    }

    // Generate a secure, random crypto token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash it and save it to the database with a 15-minute expiration
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send the email using your existing utility
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    // Send the password reset email using the specialized utility
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json({ message: 'Password reset link sent to your email!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    // Re-hash the token from the URL to compare it with the database
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() } // Ensure it hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Validate that a new password was actually provided
    if (!req.body.password || req.body.password.trim().length === 0) {
      return res.status(400).json({ message: 'Password cannot be empty' });
    }

    // Hash the new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Clear the reset fields so the token can't be used again
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
