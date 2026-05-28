import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, LogIn, LogOut,
  Calendar, User, Search, Filter, TrendingUp
} from 'lucide-react';

function AttendanceTracking() {
  const [attendance, setAttendance] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterRole, setFilterRole] = useState('All'); // New state for role filter
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchStaff();
    if (selectedStaff) {
      fetchAttendance();
    } // Re-fetch attendance if selectedStaff, month, or year changes
  }, [selectedStaff, selectedMonth, selectedYear, filterRole]); // Add filterRole to dependencies

  // आज का रिकॉर्ड ढूंढें (चेक-इन स्टेटस के लिए)
  const todayRecord = useMemo(() => {
    return attendance.find(record => 
      new Date(record.date).toDateString() === new Date().toDateString()
    );
  }, [attendance]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/staff');
      const allStaffData = response.data.data || response.data; // Ensure correct data extraction
      setStaff(allStaffData);
      // If no staff is selected, or the previously selected staff is no longer in the filtered list, select the first one
      const filteredStaff = allStaffData.filter(s => filterRole === 'All' || s.role === filterRole);
      if (filteredStaff.length > 0 && (!selectedStaff || !filteredStaff.some(s => s._id === selectedStaff))) { // Check if selectedStaff is still valid in filtered list
        setSelectedStaff(filteredStaff[0]._id);
      }
    } catch (error) {
      showToast('Error fetching staff', 'error');
    }
  };

  const fetchAttendance = async () => {
    if (!selectedStaff) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/attendance/staff/${selectedStaff}`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      
      // बैकएंड से आए डेटा को फ्लेक्सिबल तरीके से हैंडल करें
      const result = response.data.data || response.data;
      
      setAttendance(result.attendance || (Array.isArray(result) ? result : []));
      setStats(result.stats || null);
    } catch (error) {
      showToast('Error fetching attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedStaff) return;
    try {
      await axios.post('/api/attendance/check-in', { staffId: selectedStaff });
      showToast('Check-in successful!', 'success');
      fetchAttendance();
    } catch (error) {
      console.error("Check-in Error:", error.response?.data);
      let errorMessage = 'Error during check-in';
      const serverError = error.response?.data?.error || error.response?.data?.message;

      if (serverError && serverError.includes('E11000')) {
        errorMessage = 'Staff member is already checked in for today.';
      } else if (serverError) {
        errorMessage = serverError;
      }

      showToast(errorMessage, 'error');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedStaff) return;
    try {
      await axios.post('/api/attendance/check-out', { staffId: selectedStaff });
      showToast('Check-out successful!', 'success');
      fetchAttendance();
    } catch (error) {
      console.error("Check-out Error:", error.response?.data);
      showToast(error.response?.data?.error || error.response?.data?.message || 'Error during check-out', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Present': 'bg-green-100 text-green-800',
      'Absent': 'bg-red-100 text-red-800',
      'Late': 'bg-yellow-100 text-yellow-800',
      'Half Day': 'bg-blue-100 text-blue-800',
      'On Leave': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Present': <CheckCircle2 className="w-5 h-5" />,
      'Absent': <XCircle className="w-5 h-5" />,
      'Late': <AlertCircle className="w-5 h-5" />,
      'Half Day': <Clock className="w-5 h-5" />,
      'On Leave': <Calendar className="w-5 h-5" />
    };
    return icons[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-10 h-10 text-blue-600" />
                Attendance Tracking
              </h1>
              <p className="text-gray-600 mt-2">Monitor staff check-in and check-out</p>
            </div>
          </div>
        </motion.div>

        {/* Selection and Quick Actions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Staff</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {staff.map(s => (
                  <option key={s._id} value={s._id}>{s.name} - {s.role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={i} value={new Date().getFullYear() - i}>
                    {new Date().getFullYear() - i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckIn}
              disabled={!!todayRecord}
              className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-lg transition-all ${
                todayRecord ? 'bg-gray-400 cursor-not-allowed text-gray-200' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <LogIn className="w-5 h-5" />
              {todayRecord ? 'Already Checked In' : 'Check In'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckOut}
              disabled={!todayRecord || !!todayRecord.checkOutTime}
              className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-lg transition-all ${
                (!todayRecord || todayRecord.checkOutTime) ? 'bg-gray-400 cursor-not-allowed text-gray-200' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <LogOut className="w-5 h-5" />
              {todayRecord?.checkOutTime ? 'Already Checked Out' : 'Check Out'}
            </motion.button>
          </div>
        </motion.div>

        {/* Statistics */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Present</div>
              <div className="text-3xl font-bold text-green-600">{stats.present}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Absent</div>
              <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Late</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Half Day</div>
              <div className="text-3xl font-bold text-blue-600">{stats.halfDay}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">On Leave</div>
              <div className="text-3xl font-bold text-purple-600">{stats.onLeave}</div>
            </div>
          </motion.div>
        )}

        {/* Attendance Records */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Attendance Records
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading attendance...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Staff Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check-In</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check-Out</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Hours</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium italic">No attendance records found for this period.</p>
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record, idx) => (
                    <motion.tr
                      key={record._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`hover:bg-gray-50 transition-colors ${
                        new Date(record.date).toDateString() === new Date().toDateString() 
                        ? 'bg-blue-50/70 border-l-4 border-blue-500' 
                        : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                        {new Date(record.date).toDateString() === new Date().toDateString() && (
                          <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">Today</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {record.staffId?.name || (typeof record.staffId === 'string' ? record.staffId : 'N/A')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkInTime 
                          ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkOutTime 
                          ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.hoursWorked ? record.hoursWorked.toFixed(1) : '-'} hrs
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          // onClick={() => handleEditAttendance(record._id)} // Add actual edit logic later
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Edit
                        </button>
                      </td>
                    </motion.tr>
                  )))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AttendanceTracking;
