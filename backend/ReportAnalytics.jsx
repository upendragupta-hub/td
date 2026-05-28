import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, Calendar, Activity, 
  Download, Filter, IndianRupee, ArrowUpRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

const ReportAnalytics = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeDoctors: 0
  });
  const [appointmentTrend, setAppointmentTrend] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Data fetch karne ke liye function call
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Note: backend implementation ke hisaab se URL change karein
      // const response = await axios.get('/api/admin/analytics');
      
      // Mock Data (Jab tak backend API fully ready nahi hoti)
      setStats({
        totalPatients: 1284,
        totalAppointments: 456,
        totalRevenue: 95400,
        activeDoctors: 32
      });

      setAppointmentTrend([
        { name: 'Jan', appointments: 45, revenue: 12000 },
        { name: 'Feb', appointments: 52, revenue: 15000 },
        { name: 'Mar', appointments: 48, revenue: 14000 },
        { name: 'Apr', appointments: 61, revenue: 18000 },
        { name: 'May', appointments: 55, revenue: 16500 },
        { name: 'Jun', appointments: 67, revenue: 21000 },
      ]);

      setDepartmentData([
        { name: 'Cardiology', patients: 120 },
        { name: 'Neurology', patients: 85 },
        { name: 'General', patients: 210 },
        { name: 'Pediatrics', patients: 95 },
        { name: 'Orthopedics', patients: 110 },
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Welcome back to WeCare Admin Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">
            <Filter size={18} /> Filter
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+12%' },
          { label: 'Appointments', value: stats.totalAppointments, icon: Calendar, color: 'text-green-600', bg: 'bg-green-100', trend: '+5%' },
          { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+18%' },
          { label: 'Active Doctors', value: stats.activeDoctors, icon: Activity, color: 'text-red-600', bg: 'bg-red-100', trend: 'Stable' },
        ].map((item, index) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className={`${item.bg} p-2 rounded-lg`}>
                <item.icon className={item.color} size={24} />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} /> {item.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">{item.label}</p>
              <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue & Appointment Trend */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Growth Over Time</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={appointmentTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRev)" />
                <Line type="monotone" dataKey="appointments" stroke="#2563eb" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Wise Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Patient Load by Department</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="patients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportAnalytics;