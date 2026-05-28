import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helpers for User Authentication
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

// @desc    Register a new user/patient
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Validation: Ensure all fields are provided
    if (!username || !email || !password) {
      console.warn(`⚠️ Registration failed: Missing fields. Body:`, req.body);
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.warn(`⚠️ Registration failed: Email ${email} already exists.`);
      return res.status(400).json({ success: false, message: 'User already registered with this email' });
    }

    const user = await User.create({ username, email, password, phone });
    const token = generateToken(user._id);
    
    res.cookie('patient_token', token, getCookieOptions());
    // Sanitize: Convert to object and remove password before sending response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: userResponse, token }
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: errors.join(', ') // Join multiple validation messages if any
      });
    }
    // Handle duplicate key error from MongoDB (e.g., if username must be unique)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or Username already exists' });
    }
    res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
};

// @desc    Login user/patient
// @route   POST /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Ensure credentials are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    console.log(`Attempting login for email: ${email}`);

    // Find user and explicitly select password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.warn(`❌ Login failed: No user found with email ${email}.`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`❌ Login failed for ${email}: Password mismatch.`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      console.warn(`❌ Login failed for ${email}: Account suspended.`);
      return res.status(403).json({ success: false, message: 'Your account is suspended. Contact support.' });
    }

    const token = generateToken(user._id);
    res.cookie('patient_token', token, getCookieOptions());

    // Sanitize: Convert to object and remove password before sending response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: userResponse, token }
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    // Find user by ID (req.userId is typically set by your 'protect' middleware)
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error("❌ getUserProfile Error:", error); // Log the full error for debugging
    res.status(500).json({ success: false, message: 'Server error while fetching profile', error: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    const duplicateChecks = [];
    if (username) duplicateChecks.push({ username });
    if (email) duplicateChecks.push({ email });

    const existingUser = duplicateChecks.length > 0
      ? await User.findOne({
          _id: { $ne: req.userId },
          $or: duplicateChecks,
        })
      : null;

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already taken',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { username, email, phone },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message,
    });
  }
};

// @desc    Change current user password
// @route   PUT /api/users/password
export const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) { // This case should ideally not happen if protect middleware works correctly
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: error.message,
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    // Admin fetches all 'user' (patient) accounts.
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("❌ getUsers Error:", error); // Log the full error for debugging.
    res.status(500).json({ success: false, message: 'Server error while fetching users', error: error.message });
  }
};

// @desc    Update user active status
// @route   PATCH /api/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ 
      success: true, 
      message: `User account has been ${isActive ? 'activated' : 'suspended'} successfully`,
      data: user 
    });
  } catch (error) {
    console.error("❌ updateUserStatus Error:", error); // Log the full error for debugging.
    res.status(500).json({ success: false, message: 'Server error while updating status', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User account deleted permanently' });
  } catch (error) {
    console.error("❌ deleteUser Error:", error); // Log the full error for debugging.
    res.status(500).json({ success: false, message: 'Server error while deleting user', error: error.message });
  }
};

// @desc    Logout user/patient
// @route   POST /api/users/logout
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie('patient_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout Error:", error); // Log the full error for debugging.
    res.status(500).json({ success: false, message: "Internal Server Error during logout", error: error.message });
  }
};
