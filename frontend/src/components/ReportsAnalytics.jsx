import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Calendar, Clock, DollarSign,
  Download, Filter
} from 'lucide-react';

function ReportsAnalytics() {
  const [staffStats, setStaffStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [payrollStats, setPayrollStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllStats();
  }, [selectedMonth, selectedYear]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [staffRes, attendanceRes, leaveRes, payrollRes] = await Promise.all([
        axios.get('/api/staff/stats/overview'),
        axios.get('/api/attendance/summary/monthly', {
          params: { month: selectedMonth, year: selectedYear }
        }),
        axios.get('/api/leave/stats/overview', {
          params: { year: selectedYear }
        }),
        axios.get('/api/payroll/stats/overview', {
          params: { month: selectedMonth, year: selectedYear }
        })
      ]);

      setStaffStats(staffRes.data);
      setAttendanceStats(attendanceRes.data);
      setLeaveStats(leaveRes.data);
      setPayrollStats(payrollRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (reportType) => {
    const content = `
${reportType.toUpperCase()} REPORT
Generated: ${new Date().toLocaleDateString()}
Period: ${selectedMonth}/${selectedYear}
========================================

${reportType === 'staff' ? `
STAFF STATISTICS
----------------------------------
Total Staff: ${staffStats?.totalStaff || 0}
Active Staff: ${staffStats?.activeStaff || 0}
Inactive Staff: ${staffStats?.inactiveStaff || 0}

Staff by Role:
${staffStats?.staffByRole?.map(r => `  ${r._id}: ${r.count}`).join('\n')}
` : ''}

${reportType === 'attendance' ? `
ATTENDANCE REPORT
Month: ${selectedMonth}/${selectedYear}
----------------------------------
${Array.isArray(attendanceStats) && attendanceStats.length > 0 ? 
  attendanceStats.map(a => `
Staff ID: ${a._id}
Present: ${a.present}
Absent: ${a.absent}
Late: ${a.late}
Half Day: ${a.halfDay}
On Leave: ${a.onLeave}
`).join('\n') : 'No attendance data available'}
` : ''}

${reportType === 'leave' ? `
LEAVE STATISTICS
Year: ${selectedYear}
----------------------------------
Pending Requests: ${leaveStats?.statusCounts?.pending || 0}
Approved Requests: ${leaveStats?.statusCounts?.approved || 0}
Rejected Requests: ${leaveStats?.statusCounts?.rejected || 0}

Leave by Type:
${leaveStats?.byType?.map(l => `  ${l._id}: ${l.count} requests (${l.totalDays} days)`).join('\n')}
` : ''}

${reportType === 'payroll' ? `
PAYROLL REPORT
Month: ${selectedMonth}/${selectedYear}
----------------------------------
Total Payrolls: ${payrollStats?.totalPayrolls || 0}
Paid: ${payrollStats?.paid || 0}
Pending: ${payrollStats?.pending || 0}

Total Salary: ₹${(payrollStats?.totalNetSalary || 0).toLocaleString()}
Total Earnings: ₹${(payrollStats?.totalEarnings || 0).toLocaleString()}
Total Deductions: ₹${(payrollStats?.totalDeductions || 0).toLocaleString()}
Average Salary: ₹${(payrollStats?.averageSalary || 0).toLocaleString()}
` : ''}

========================================
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `${reportType}-report-${selectedMonth}-${selectedYear}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <BarChart3 className="w-10 h-10 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600">Monitor staff performance, attendance, and payroll metrics</p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
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
            <div className="flex-1">
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
            <div className="flex-1 pt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchAllStats}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Generate Reports
              </motion.button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : (
          <>
            {/* Staff Statistics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  Staff Statistics
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => downloadReport('staff')}
                  className="flex items-center gap-2 bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-blue-600 bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Staff</div>
                  <div className="text-4xl font-bold text-blue-600 mt-2">{staffStats?.totalStaff || 0}</div>
                </div>
                <div className="border-l-4 border-green-600 bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Active</div>
                  <div className="text-4xl font-bold text-green-600 mt-2">{staffStats?.activeStaff || 0}</div>
                </div>
                <div className="border-l-4 border-red-600 bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Inactive</div>
                  <div className="text-4xl font-bold text-red-600 mt-2">{staffStats?.inactiveStaff || 0}</div>
                </div>
              </div>

              {staffStats?.staffByRole && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-gray-900 mb-4">Staff by Role</h3>
                  <div className="space-y-3">
                    {staffStats.staffByRole.map((role, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-gray-700">{role._id}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-blue-200 rounded-full" style={{ width: '100px' }}></div>
                          <span className="font-bold text-gray-900 w-12">{role.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Attendance Statistics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Clock className="w-8 h-8 text-green-600" />
                  Attendance Report - {selectedMonth}/{selectedYear}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => downloadReport('attendance')}
                  className="flex items-center gap-2 bg-green-100 text-green-600 hover:bg-green-200 px-4 py-2 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              </div>

              {Array.isArray(attendanceStats) && attendanceStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Staff ID</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Present</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Absent</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Late</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Half Day</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">On Leave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceStats.map((record, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record._id}</td>
                          <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">{record.present}</td>
                          <td className="px-4 py-3 text-center text-sm text-red-600 font-semibold">{record.absent}</td>
                          <td className="px-4 py-3 text-center text-sm text-yellow-600 font-semibold">{record.late}</td>
                          <td className="px-4 py-3 text-center text-sm text-blue-600 font-semibold">{record.halfDay}</td>
                          <td className="px-4 py-3 text-center text-sm text-purple-600 font-semibold">{record.onLeave}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No attendance data available for this period</p>
              )}
            </motion.div>

            {/* Leave Statistics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-600" />
                  Leave Statistics - {selectedYear}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => downloadReport('leave')}
                  className="flex items-center gap-2 bg-purple-100 text-purple-600 hover:bg-purple-200 px-4 py-2 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="border-l-4 border-yellow-600 bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Pending</div>
                  <div className="text-4xl font-bold text-yellow-600 mt-2">{leaveStats?.statusCounts?.pending || 0}</div>
                </div>
                <div className="border-l-4 border-green-600 bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Approved</div>
                  <div className="text-4xl font-bold text-green-600 mt-2">{leaveStats?.statusCounts?.approved || 0}</div>
                </div>
                <div className="border-l-4 border-red-600 bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Rejected</div>
                  <div className="text-4xl font-bold text-red-600 mt-2">{leaveStats?.statusCounts?.rejected || 0}</div>
                </div>
              </div>

              {leaveStats?.byType && (
                <div className="pt-6 border-t">
                  <h3 className="font-bold text-gray-900 mb-4">Leave by Type</h3>
                  <div className="space-y-3">
                    {leaveStats.byType.map((leave, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-700 font-medium">{leave._id}</span>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{leave.count} requests</div>
                          <div className="text-sm text-gray-600">{leave.totalDays} days total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Payroll Statistics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  Payroll Report - {selectedMonth}/{selectedYear}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => downloadReport('payroll')}
                  className="flex items-center gap-2 bg-green-100 text-green-600 hover:bg-green-200 px-4 py-2 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                  <div className="text-sm text-gray-600">Total Payrolls</div>
                  <div className="text-3xl font-bold text-blue-600 mt-2">{payrollStats?.totalPayrolls || 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                  <div className="text-sm text-gray-600">Paid</div>
                  <div className="text-3xl font-bold text-green-600 mt-2">{payrollStats?.paid || 0}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-600">
                  <div className="text-sm text-gray-600">Pending</div>
                  <div className="text-3xl font-bold text-yellow-600 mt-2">{payrollStats?.pending || 0}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-600">
                  <div className="text-sm text-gray-600">Avg Salary</div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">₹{(payrollStats?.averageSalary || 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-gray-600 text-sm mb-2">Total Salary</div>
                  <div className="text-2xl font-bold text-gray-900">₹{(payrollStats?.totalNetSalary || 0).toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 text-sm mb-2">Total Earnings</div>
                  <div className="text-2xl font-bold text-green-600">₹{(payrollStats?.totalEarnings || 0).toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 text-sm mb-2">Total Deductions</div>
                  <div className="text-2xl font-bold text-red-600">₹{(payrollStats?.totalDeductions || 0).toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportsAnalytics;
