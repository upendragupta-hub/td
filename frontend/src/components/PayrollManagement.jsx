import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, Download, Eye, Check, Calendar, TrendingUp,
  X, User, FileText, Zap
} from 'lucide-react';

function PayrollManagement() {
  const [payroll, setPayroll] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCalculateForm, setShowCalculateForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [stats, setStats] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchStaff();
    fetchPayroll();
    fetchStats();
  }, [selectedMonth, selectedYear, selectedStaff, filterStatus]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      showToast('Error fetching staff', 'error');
    }
  };

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payroll', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setPayroll(response.data);
    } catch (error) {
      showToast('Error fetching payroll', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/payroll/stats/overview', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCalculatePayroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payroll/calculate-all', {
        month: formData.month,
        year: formData.year
      });
      showToast('Payroll calculated successfully for all staff', 'success');
      setShowCalculateForm(false);
      fetchPayroll();
      fetchStats();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error calculating payroll', 'error');
    }
  };

  const handleApprovePayroll = async (id) => {
    try {
      await axios.put(`/api/payroll/${id}/approve`, {
        approvedBy: 'admin'
      });
      showToast('Payroll approved successfully', 'success');
      fetchPayroll();
      fetchStats();
    } catch (error) {
      showToast('Error approving payroll', 'error');
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await axios.put(`/api/payroll/${id}/mark-paid`, {
        paymentMethod: 'Bank Transfer'
      });
      showToast('Payroll marked as paid', 'success');
      fetchPayroll();
      fetchStats();
    } catch (error) {
      showToast('Error marking payroll as paid', 'error');
    }
  };

  const handleDownloadSalarySlip = async (id) => {
    try {
      const response = await axios.get(`/api/payroll/${id}/salary-slip`);
      const salarySlip = response.data.salarySlip;
      
      const content = `
SALARY SLIP
==================================================
Employee ID: ${salarySlip.employeeId}
Employee Name: ${salarySlip.employeeName}
Role: ${salarySlip.role}
Month: ${salarySlip.month}/${salarySlip.year}

EARNINGS
--------------------------------------------------
Basic Salary: ₹${salarySlip.basicSalary.toLocaleString()}
Overtime: ₹${salarySlip.earnings.overtime.toLocaleString()}
Bonus: ₹${salarySlip.earnings.bonus.toLocaleString()}
Incentive: ₹${salarySlip.earnings.incentive.toLocaleString()}
--------------------------------------------------
Total Earnings: ₹${salarySlip.earnings.total.toLocaleString()}

DEDUCTIONS
--------------------------------------------------
Unpaid Leave: ₹${salarySlip.deductions.unpaidLeave.toLocaleString()}
Late Deduction: ₹${salarySlip.deductions.lateDeduction.toLocaleString()}
Tax: ₹${salarySlip.deductions.tax.toLocaleString()}
Other: ₹${salarySlip.deductions.other.toLocaleString()}
--------------------------------------------------
Total Deductions: ₹${salarySlip.deductions.total.toLocaleString()}

NET SALARY: ₹${salarySlip.netSalary.toLocaleString()}

ATTENDANCE
--------------------------------------------------
Working Days: ${salarySlip.attendance.workingDays}
Present Days: ${salarySlip.attendance.presentDays}
Leave Taken: ${salarySlip.attendance.leaveTaken}

STATUS: ${salarySlip.status}
PAID DATE: ${salarySlip.paidDate ? new Date(salarySlip.paidDate).toLocaleDateString() : 'Not Paid'}
PAYMENT METHOD: ${salarySlip.paymentMethod}
==================================================`;
      
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
      element.setAttribute('download', `SalarySlip_${salarySlip.employeeName}_${salarySlip.month}_${salarySlip.year}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('Salary slip downloaded successfully', 'success');
    } catch (error) {
      showToast('Error downloading salary slip', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Calculated': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Paid': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredPayroll = payroll.filter(p => {
    const staffMatch = selectedStaff === 'All' || p.staffId._id === selectedStaff;
    const statusMatch = filterStatus === 'All' || p.status === filterStatus;
    return staffMatch && statusMatch;
  });

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
                <DollarSign className="w-10 h-10 text-blue-600" />
                Payroll Management
              </h1>
              <p className="text-gray-600 mt-2">Calculate, approve, and process staff salaries</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCalculateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full flex items-center gap-2 font-semibold shadow-lg"
            >
              <Zap className="w-5 h-5" />
              Calculate Payroll
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
              <div className="text-sm text-gray-600">Total Payrolls</div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalPayrolls}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Paid</div>
              <div className="text-3xl font-bold text-green-600">{stats.paid}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Total Salary</div>
              <div className="text-2xl font-bold text-blue-600">₹{(stats.totalNetSalary / 100000).toFixed(2)}L</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Avg Salary</div>
              <div className="text-2xl font-bold text-purple-600">₹{(stats.averageSalary / 1000).toFixed(0)}K</div>
            </div>
          </motion.div>
        )}

        {/* Filters and Controls */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Calculated">Calculated</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Staff</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Staff</option>
                {staff.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Payroll List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Payroll Records
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading payroll...</p>
            </div>
          ) : filteredPayroll.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payroll records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Basic</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Earnings</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Deductions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Net Salary</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayroll.map((p, idx) => (
                    <motion.tr
                      key={p._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.staffId?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.month}/{p.year}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{p.basicSalary?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-semibold">₹{p.totalEarnings?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-semibold">₹{p.totalDeductions?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">₹{p.netSalary?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {p.status === 'Calculated' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleApprovePayroll(p._id)}
                              className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </motion.button>
                          )}
                          {(p.status === 'Approved' || p.status === 'Calculated') && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleMarkAsPaid(p._id)}
                              className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-lg"
                              title="Mark as Paid"
                            >
                              <Zap className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleDownloadSalarySlip(p._id)}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg"
                            title="Download Slip"
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => {
                              setSelectedPayroll(p);
                              setShowDetails(true);
                            }}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calculate Payroll Form Modal */}
        <AnimatePresence>
          {showCalculateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCalculateForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Calculate Payroll</h2>
                <form onSubmit={handleCalculatePayroll} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Month*</label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year*</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <option key={i} value={new Date().getFullYear() - i}>
                          {new Date().getFullYear() - i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="border-t pt-6 flex gap-4 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCalculateForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Calculate
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details Modal */}
        <AnimatePresence>
          {showDetails && selectedPayroll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Payroll Details</h2>
                  <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Employee</div>
                      <div className="text-lg font-bold text-gray-900">{selectedPayroll.staffId?.name}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Period</div>
                      <div className="text-lg font-bold text-gray-900">{selectedPayroll.month}/{selectedPayroll.year}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-3 text-green-700">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Basic Salary</span>
                        <span className="font-semibold">₹{selectedPayroll.basicSalary?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overtime</span>
                        <span className="font-semibold">₹{selectedPayroll.earnings?.overtime?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bonus</span>
                        <span className="font-semibold">₹{selectedPayroll.earnings?.bonus?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-bold text-gray-900">Total Earnings</span>
                        <span className="font-bold text-green-600">₹{selectedPayroll.totalEarnings?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-3 text-red-700">Deductions</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unpaid Leave</span>
                        <span className="font-semibold">₹{selectedPayroll.deductions?.unpaidLeave?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Late Deduction</span>
                        <span className="font-semibold">₹{selectedPayroll.deductions?.lateDeduction?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-semibold">₹{selectedPayroll.deductions?.tax?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-bold text-gray-900">Total Deductions</span>
                        <span className="font-bold text-red-600">₹{selectedPayroll.totalDeductions?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">NET SALARY</span>
                      <span className="text-3xl font-bold text-blue-600">₹{selectedPayroll.netSalary?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-3">Attendance</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Working Days</div>
                        <div className="text-2xl font-bold text-gray-900">{selectedPayroll.workingDays}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Present Days</div>
                        <div className="text-2xl font-bold text-green-600">{selectedPayroll.attendanceDays}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Leave Taken</div>
                        <div className="text-2xl font-bold text-blue-600">{selectedPayroll.leaveTaken}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-[100] ${
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

export default PayrollManagement;
