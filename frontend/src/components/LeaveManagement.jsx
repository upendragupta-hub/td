import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Send,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Unpaid Leave',
];

const INITIAL_FORM = {
  staffId: '',
  leaveType: 'Casual Leave',
  startDate: '',
  endDate: '',
  reason: '',
};

function LeaveManagement() {
  const { admin } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    fetchStaff();
    fetchLeaves();
    fetchStats();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data || []);
    } catch (error) {
      showToast('Error fetching staff', 'error');
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leave');
      setLeaves(response.data || []);
    } catch (error) {
      showToast('Error fetching leaves', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/leave/stats/overview', {
        params: { year: new Date().getFullYear() },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching leave stats:', error);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/api/leave', formData);
      showToast('Leave application submitted successfully', 'success');
      setShowForm(false);
      resetForm();
      fetchLeaves();
      fetchStats();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error submitting leave', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/leave/${id}/approve`, {
        approvedBy: admin?.username || 'admin',
      });
      showToast('Leave approved successfully', 'success');
      fetchLeaves();
      fetchStats();
    } catch (error) {
      showToast('Error approving leave', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/api/leave/${id}/reject`, {
        rejectionReason: 'Rejected by admin',
        approvedBy: admin?.username || 'admin',
      });
      showToast('Leave rejected successfully', 'success');
      fetchLeaves();
      fetchStats();
    } catch (error) {
      showToast('Error rejecting leave', 'error');
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const statusMatch = filterStatus === 'All' || leave.status === filterStatus;
      const staffMatch = selectedStaffFilter === 'All' || leave.staffId?._id === selectedStaffFilter;
      const search = searchQuery.trim().toLowerCase();

      if (!search) return statusMatch && staffMatch;

      return (
        statusMatch &&
        staffMatch &&
        (`${leave.staffId?.name || ''} ${leave.leaveType || ''} ${leave.reason || ''}`
          .toLowerCase()
          .includes(search))
      );
    });
  }, [filterStatus, leaves, searchQuery, selectedStaffFilter]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-600 border border-rose-200';
      default:
        return 'bg-amber-50 text-amber-600 border border-amber-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="surface-panel-strong p-8 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Leave Control</span>
            <h1 className="mt-5 text-4xl font-extrabold text-slate-900">Leave management that feels cleaner and faster.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Review staff requests, apply leave on behalf of a team member when needed, and keep approval flow visible at a glance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="primary-button px-6 py-4 text-sm"
          >
            <Plus className="h-5 w-5" />
            Apply for Leave
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Pending</p>
            <p className="mt-3 text-3xl font-extrabold text-amber-600">{stats.statusCounts?.pending || 0}</p>
          </div>
          <div className="metric-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Approved</p>
            <p className="mt-3 text-3xl font-extrabold text-emerald-600">{stats.statusCounts?.approved || 0}</p>
          </div>
          <div className="metric-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Rejected</p>
            <p className="mt-3 text-3xl font-extrabold text-rose-600">{stats.statusCounts?.rejected || 0}</p>
          </div>
          <div className="metric-card-dark p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">Leave Types</p>
            <p className="mt-3 text-3xl font-extrabold text-white">{stats.byType?.length || 0}</p>
          </div>
        </div>
      )}

      <div className="surface-panel-strong p-6 sm:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Search</label>
            <div className="field-shell">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by staff name, type, or reason"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Filter by Status</label>
            <div className="field-shell">
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Filter by Staff</label>
            <div className="field-shell">
              <select value={selectedStaffFilter} onChange={(event) => setSelectedStaffFilter(event.target.value)}>
                <option value="All">All Staff</option>
                {staff.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="surface-panel-strong rounded-[2rem] px-8 py-16 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-700" />
            <p className="mt-5 font-bold text-cyan-700">Loading leave requests...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="surface-panel-strong rounded-[2rem] px-8 py-16 text-center">
            <CalendarRange className="mx-auto h-14 w-14 text-slate-300" />
            <p className="mt-5 text-lg font-bold text-slate-900">No leave requests found</p>
            <p className="mt-2 text-sm text-slate-500">Try changing filters or add a new leave request.</p>
          </div>
        ) : (
          filteredLeaves.map((leave, index) => (
            <motion.div
              key={leave._id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="surface-panel-strong p-6 sm:p-7"
            >
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.9fr_0.9fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="soft-badge">
                      <User className="h-4 w-4" />
                      {leave.staffId?.name}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase ${getStatusClass(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold text-slate-900">{leave.leaveType}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{leave.reason}</p>
                </div>

                <div className="metric-card p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Dates</p>
                  <p className="mt-3 text-base font-bold text-slate-900">
                    {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{calculateDays(leave.startDate, leave.endDate)} day(s)</p>
                </div>

                <div className="flex flex-col gap-3">
                  {leave.status === 'Pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(leave._id)}
                        className="secondary-button justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(leave._id)}
                        className="secondary-button justify-center bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="metric-card p-5">
                      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Final Status</p>
                      <p className="mt-3 text-lg font-extrabold text-slate-900">{leave.status}</p>
                      {leave.rejectionReason && (
                        <p className="mt-2 text-sm text-rose-600">{leave.rejectionReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="surface-panel-strong w-full max-w-2xl rounded-[2rem] p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">New Leave Request</span>
                  <h2 className="mt-5 text-3xl font-extrabold text-slate-900">Apply for Leave</h2>
                  <p className="mt-3 text-sm text-slate-500">Create a leave request for any staff member.</p>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="secondary-button h-12 w-12 p-0">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Staff Member</label>
                  <div className="field-shell">
                    <select
                      value={formData.staffId}
                      onChange={(event) => setFormData((prev) => ({ ...prev, staffId: event.target.value }))}
                      required
                    >
                      <option value="">Select Staff</option>
                      {staff.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} - {member.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Leave Type</label>
                  <div className="field-shell">
                    <select
                      value={formData.leaveType}
                      onChange={(event) => setFormData((prev) => ({ ...prev, leaveType: event.target.value }))}
                    >
                      {LEAVE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Start Date</label>
                    <div className="field-shell">
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">End Date</label>
                    <div className="field-shell">
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(event) => setFormData((prev) => ({ ...prev, endDate: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="metric-card flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Duration</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">
                      {calculateDays(formData.startDate, formData.endDate) > 0
                        ? `${calculateDays(formData.startDate, formData.endDate)} day(s)`
                        : 'Select valid dates'}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-cyan-700" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Reason</label>
                  <div className="field-shell items-start">
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                      placeholder="Explain the leave request..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="secondary-button px-5 py-3">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="primary-button px-6 py-3 disabled:opacity-70">
                    {submitting ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed right-4 top-4 z-[110] rounded-[1.2rem] px-6 py-3 text-white shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LeaveManagement;
