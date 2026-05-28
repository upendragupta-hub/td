import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes - verify JWT token for users
export const protectUser = async (req, res, next) => {
  try {
    let token;

    // Prefer patient-specific auth sources so an admin session cookie
    // does not accidentally override a logged-in patient's token.
    if (req.cookies && req.cookies.patient_token) {
      token = req.cookies.patient_token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // Backward-compatible fallback for older user sessions.
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    // Attach user ID to request
    req.userId = decoded.id;
    req.user = user; // Attach full user object if needed

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("❌ User Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during user authentication",
      error: error.message,
    });
  }
};

// Restrict to specific roles for users (e.g., 'premium')
export const restrictUserTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to perform this action",
      });
    }
    next();
  };
};
