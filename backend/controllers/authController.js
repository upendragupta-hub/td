import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

const sanitizeAdmin = (admin) => {
  const adminObject = admin.toObject ? admin.toObject() : { ...admin };
  delete adminObject.password;
  return adminObject;
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password',
      });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin already exists with this email or username',
      });
    }

    const admin = await Admin.create({ username, email, password });
    const token = generateToken(admin._id);

    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: sanitizeAdmin(admin),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register admin',
      error: error.message,
    });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your admin account is deactivated',
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);
    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: sanitizeAdmin(admin),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to login admin',
      error: error.message,
    });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to logout admin',
      error: error.message,
    });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId || req.userId).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        admin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: error.message,
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { username, email } = req.body;

    const duplicateChecks = [];
    if (username) duplicateChecks.push({ username });
    if (email) duplicateChecks.push({ email });

    const existingAdmin = duplicateChecks.length
      ? await Admin.findOne({
          _id: { $ne: req.adminId || req.userId },
          $or: duplicateChecks,
        })
      : null;

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already taken',
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.adminId || req.userId,
      { username, email },
      { new: true, runValidators: true },
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update admin profile',
      error: error.message,
    });
  }
};

export const changeAdminPassword = async (req, res) => {
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

    const admin = await Admin.findById(req.adminId || req.userId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change admin password',
      error: error.message,
    });
  }
};
