import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
    maxlength: [30, "Username cannot exceed 30 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false, // Don't return password by default in queries
  },
  role: {
    type: String,
    enum: ["admin", "superadmin"],
    default: "admin",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
}, { timestamps: true });

// Hash password before saving using asynchronous middleware
adminSchema.pre("save", async function() {
  // Only hash if password was modified
  if (!this.isModified("password")) {
    // Update passwordChangedAt for existing documents
    if (!this.isNew && this.isModified()) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    return;
  }
  
  try {
    // Use asynchronous hashing for better performance in Node.js
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt for existing documents
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
  } catch (error) {
    console.error("❌ Error hashing password:", error);
    throw error; // Throwing error inside async middleware is equivalent to next(error)
  }
});

// Method to check password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
adminSchema.methods.toJSON = function() {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;