import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';     
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import ambulanceRoutes from './routes/ambulanceRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import bedRoutes from './routes/bedRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import bloodBankRoutes from './routes/bloodBankRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import { initSocketServer } from './utils/socketServer.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
initSocketServer(server);

const allowedOrigins = Array.from(
  new Set([
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ].filter(Boolean)),
);

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

// Enhanced CORS Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (mobile apps, server-to-server, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    callback(null, true); // Allow it anyway for debugging, but log it
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-JSON-Response-Size'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wecare_hospital')
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${process.env.MONGO_URI?.split('/').pop()?.split('?')[0] || 'local'}`);
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⚠️ Server will still start but database features will use fallback data');
    });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => console.log('📡 MongoDB connected'));
mongoose.connection.on('disconnected', () => console.log('❌ MongoDB disconnected'));
mongoose.connection.on('error', (err) => console.error('🔴 MongoDB error:', err.message));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WeCare backend is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WeCare backend is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WeCare backend is working perfectly!',
    environment: process.env.NODE_ENV,
    backendUrl: process.env.BACKEND_PUBLIC_URL,
    frontendUrl: process.env.FRONTEND_URL,
  });
});

app.get('/api/config/razorpay', (req, res) => {
  res.status(200).json({
    keyId: process.env.RAZORPAY_KEY_ID || null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/blood-bank', bloodBankRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/staff', staffRoutes);

// Error handling middleware (improved)
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    console.error('Stack:', err.stack);
    
    // CORS errors
    if (err.message && err.message.includes('CORS')) {
      return res.status(500).json({
        success: false,
        message: 'CORS Policy Error - Check backend configuration',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    }

    // MongoDB errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      return res.status(500).json({
        success: false,
        message: 'Database Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Database connection failed'
      });
    }

    // Generic error
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Something broke!',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 5001);

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    console.error('Server error:', error);
    process.exit(1);
  }

  const bind = typeof PORT === 'string'
    ? `Pipe ${PORT}`
    : `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges.`);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use. Stop any other process using this port or set BACKEND_PORT to a free port.`);
      break;
    default:
      console.error('Server error:', error);
  }

  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
