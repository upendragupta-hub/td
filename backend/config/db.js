import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/wecare";
    console.log(`🔌 Attempting to connect to MongoDB...`);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log("⚠️  Could not connect to MongoDB. The server will use in-memory fallbacks or return empty data.");
    console.log("💡 Tip: Set a valid MONGO_URI in your environment settings if you want to use a real database.");
  }
};

export default connectDB;
