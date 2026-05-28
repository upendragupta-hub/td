import { useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarRange,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react';

const OFFICE_LAT = 28.6075;
const OFFICE_LNG = 77.4354;
const ALLOWED_RADIUS_METERS = 120;
const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Unpaid Leave',
];

export default function StaffPortal() {
  const [staffEmail, setStaffEmail] = useState('');
  const [currentStaff, setCurrentStaff] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [staffLeaves, setStaffLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState({ searching: false, inside: false, distance: null });
  const [toast, setToast] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const todayRecord = useMemo(() => {
    return attendance.find((record) => new Date(record.date).toDateString() === new Date().toDateString());
  }, [attendance]);

  const leaveSummary = useMemo(() => {
    return staffLeaves.reduce(
      (summary, leave) => {
        const status = leave.status?.toLowerCase();
        if (status === 'pending') summary.pending += 1;
        if (status === 'approved') summary.approved += 1;
        if (status === 'rejected') summary.rejected += 1;
        return summary;
      },
      { pending: 0, approved: 0, rejected: 0 },
    );
  }, [staffLeaves]);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371e3;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
    const value =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  };

  const calculateLeaveDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  const resetLeaveForm = () => {
    setLeaveForm({
      leaveType: 'Casual Leave',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const fetchStaffAttendance = async (staffId) => {
    const response = await axios.get(`/api/attendance/staff/${staffId}`);
    const data = response.data.data || response.data;
    setAttendance(data.attendance || (Array.isArray(data) ? data : []));
  };

  const fetchStaffLeaves = async (staffId) => {
    const response = await axios.get(`/api/leave/staff/${staffId}`);
    setStaffLeaves(response.data || []);
  };

  const loadStaffWorkspace = async (staffMember) => {
    setWorkspaceLoading(true);
    try {
      await Promise.all([fetchStaffAttendance(staffMember._id), fetchStaffLeaves(staffMember._id)]);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await axios.get('/api/staff');
      const allStaff = response.data || [];
      const found = allStaff.find((member) => member.email?.toLowerCase() === staffEmail.toLowerCase());

      if (found) {
        setCurrentStaff(found);
        await loadStaffWorkspace(found);
        showToast(`Welcome, ${found.name}`, 'success');
      } else {
        showToast('Staff email not found', 'error');
      }
    } catch (error) {
      showToast('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        resolve(false);
        return;
      }

      setLocationStatus((prev) => ({ ...prev, searching: true }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            OFFICE_LAT,
            OFFICE_LNG,
          );
          const isInside = distance <= ALLOWED_RADIUS_METERS;

          setLocationStatus({
            searching: false,
            inside: isInside,
            distance: Math.round(distance),
          });

          resolve(isInside);
        },
        () => {
          setLocationStatus({ searching: false, inside: false, distance: null });
          showToast('Please enable location access', 'error');
          resolve(false);
        },
      );
    });

  const handleAttendanceAction = async (type) => {
    const isInside = await verifyLocation();
    if (!isInside) {
      showToast(
        `Access denied. You are ${locationStatus.distance ?? 'too far'}m away from the office.`,
        'error',
      );
      return;
    }

    try {
      await axios.post(`/api/attendance/${type === 'in' ? 'check-in' : 'check-out'}`, {
        staffId: currentStaff._id,
      });
      showToast(type === 'in' ? 'Check-in successful' : 'Check-out successful', 'success');
      await fetchStaffAttendance(currentStaff._id);
    } catch (error) {
      showToast(error.response?.data?.message || 'Attendance action failed', 'error');
    }
  };

  const handleLeaveSubmit = async (event) => {
    event.preventDefault();
    setLeaveSubmitting(true);

    try {
      await axios.post('/api/leave', {
        staffId: currentStaff._id,
        ...leaveForm,
      });
      showToast('Leave request submitted successfully', 'success');
      resetLeaveForm();
      await fetchStaffLeaves(currentStaff._id);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to submit leave request', 'error');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const getLeaveStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-600 border border-rose-200';
      default:
        return 'bg-amber-50 text-amber-600 border border-amber-200';
    }
  };

  if (!currentStaff) {
    return (
      <div className="surface-panel-strong grid overflow-hidden lg:grid-cols-[0.96fr_1.04fr]">
        <div className="surface-dark relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 lg:p-12">
          <div className="absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-cyan-400/12 blur-3xl" />
          <div>
            <span className="eyebrow bg-white/10 text-cyan-100">Staff Workspace</span>
            <h1 className="mt-6 text-4xl font-extrabold text-white sm:text-5xl">
              Attendance, shift snapshots, and leave requests in one clean space.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-200">
              Staff can sign in, verify location, log attendance, and submit leave requests without switching between different screens.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
              <Sparkles className="h-6 w-6 text-cyan-300" />
              <p className="mt-4 text-sm leading-7 text-slate-100">Built for quick check-ins and smoother daily coordination.</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
              <CalendarRange className="h-6 w-6 text-cyan-300" />
              <p className="mt-4 text-sm leading-7 text-slate-100">Leave requests and recent status stay visible after login.</p>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 lg:p-12">
          <span className="eyebrow">Staff Sign In</span>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Enter your staff email.</h2>
          <p className="mt-3 text-sm text-slate-500">We will load your attendance profile, shift details, and leave center.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
              <div className="field-shell">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="staff@wecare.com"
                  value={staffEmail}
                  onChange={(event) => setStaffEmail(event.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="primary-button w-full justify-center py-4 text-base disabled:opacity-70">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Open Staff Workspace
                </>
              )}
            </button>
          </form>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className={`fixed bottom-8 right-8 z-[100] rounded-[1.3rem] px-5 py-4 text-sm font-bold text-white shadow-2xl ${
                toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="surface-panel-strong overflow-hidden p-8 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Staff Workspace</span>
            <h1 className="mt-5 text-4xl font-extrabold text-slate-900">{currentStaff.name}</h1>
            <p className="mt-2 text-sm font-bold text-cyan-700">{currentStaff.role}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              <div className="soft-badge">
                <Mail className="h-4 w-4" />
                {currentStaff.email}
              </div>
              <div className="soft-badge">
                <Phone className="h-4 w-4" />
                {currentStaff.phone}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentStaff(null);
              setAttendance([]);
              setStaffLeaves([]);
              setStaffEmail('');
              resetLeaveForm();
            }}
            className="secondary-button px-5 py-3 text-sm"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Today</p>
          <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
            {todayRecord?.status || 'Not marked'}
          </h3>
          <p className="mt-2 text-sm text-slate-500">Attendance status for the current day.</p>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Shift</p>
          <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
            {currentStaff.shiftId?.name || 'General'}
          </h3>
          <p className="mt-2 text-sm text-slate-500">Assigned work schedule snapshot.</p>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Pending Leaves</p>
          <h3 className="mt-3 text-2xl font-extrabold text-amber-600">{leaveSummary.pending}</h3>
          <p className="mt-2 text-sm text-slate-500">Requests waiting for approval.</p>
        </div>
        <div className="metric-card-dark p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">Approved Leaves</p>
          <h3 className="mt-3 text-2xl font-extrabold text-white">{leaveSummary.approved}</h3>
          <p className="mt-2 text-sm text-slate-200">Approved leave requests in your history.</p>
        </div>
      </div>

      {workspaceLoading ? (
        <div className="surface-panel-strong rounded-[2rem] px-8 py-16 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-700" />
          <p className="mt-5 font-bold text-cyan-700">Loading your staff workspace...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="surface-panel-strong p-8 sm:p-10">
              <div className="mb-6 flex items-center gap-3">
                <History className="h-6 w-6 text-cyan-700" />
                <h2 className="text-2xl font-extrabold text-slate-900">Attendance Controls</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="metric-card p-6">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-2xl p-3 ${locationStatus.inside ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Location Status</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">
                        {locationStatus.searching
                          ? 'Verifying...'
                          : locationStatus.inside
                            ? 'Within Allowed Radius'
                            : 'Outside Office'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {locationStatus.distance != null
                      ? `Current distance from office: ${locationStatus.distance} meters.`
                      : 'Location will be checked during attendance actions.'}
                  </p>
                </div>

                <div className="metric-card-dark p-6">
                  <Clock className="h-8 w-8 text-cyan-300" />
                  <h3 className="mt-4 text-2xl font-extrabold text-white">Shift Snapshot</h3>
                  <div className="mt-4 space-y-2 text-sm text-slate-200">
                    <p>Check-in: {todayRecord?.checkInTime ? new Date(todayRecord.checkInTime).toLocaleTimeString() : '--:--'}</p>
                    <p>Check-out: {todayRecord?.checkOutTime ? new Date(todayRecord.checkOutTime).toLocaleTimeString() : '--:--'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!!todayRecord}
                  onClick={() => handleAttendanceAction('in')}
                  className={`rounded-[1.8rem] px-6 py-6 text-left ${
                    todayRecord
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:-translate-y-1'
                  }`}
                >
                  <LogIn className="h-6 w-6" />
                  <p className="mt-4 text-xl font-extrabold">Check In</p>
                  <p className="mt-2 text-sm opacity-90">Start today’s attendance entry.</p>
                </button>

                <button
                  type="button"
                  disabled={!todayRecord || !!todayRecord.checkOutTime}
                  onClick={() => handleAttendanceAction('out')}
                  className={`rounded-[1.8rem] px-6 py-6 text-left ${
                    !todayRecord || todayRecord.checkOutTime
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-100 hover:-translate-y-1'
                  }`}
                >
                  <LogOut className="h-6 w-6" />
                  <p className="mt-4 text-xl font-extrabold">Check Out</p>
                  <p className="mt-2 text-sm opacity-90">Close your shift attendance for today.</p>
                </button>
              </div>
            </div>

            <div className="table-shell">
              <div className="flex items-center gap-3 border-b border-slate-100 px-8 py-6">
                <History className="h-5 w-5 text-cyan-700" />
                <h2 className="text-2xl font-extrabold text-slate-900">Recent Attendance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-8 py-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Date</th>
                      <th className="px-8 py-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Status</th>
                      <th className="px-8 py-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.slice(0, 5).map((record) => (
                      <tr key={record._id} className="border-t border-slate-100">
                        <td className="px-8 py-5 font-bold text-slate-900">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-8 py-5">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                              record.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-600'
                                : record.status === 'On Leave'
                                  ? 'bg-violet-50 text-violet-600'
                                  : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {record.status === 'Present' ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-slate-600">{record.hoursWorked?.toFixed(1) || '0.0'} hrs</td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-8 py-10 text-center text-sm font-medium text-slate-500">
                          No attendance history found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="surface-panel-strong p-8 sm:p-10">
              <div className="mb-6 flex items-center gap-3">
                <CalendarRange className="h-6 w-6 text-cyan-700" />
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Apply for Leave</h2>
                  <p className="text-sm text-slate-500">Send a leave request directly from your staff workspace.</p>
                </div>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Leave Type</label>
                  <div className="field-shell">
                    <select
                      value={leaveForm.leaveType}
                      onChange={(event) => setLeaveForm((prev) => ({ ...prev, leaveType: event.target.value }))}
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
                        value={leaveForm.startDate}
                        onChange={(event) => setLeaveForm((prev) => ({ ...prev, startDate: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">End Date</label>
                    <div className="field-shell">
                      <input
                        type="date"
                        required
                        value={leaveForm.endDate}
                        onChange={(event) => setLeaveForm((prev) => ({ ...prev, endDate: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="metric-card flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Duration</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">
                      {calculateLeaveDays(leaveForm.startDate, leaveForm.endDate) > 0
                        ? `${calculateLeaveDays(leaveForm.startDate, leaveForm.endDate)} day(s)`
                        : 'Select dates'}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-cyan-700" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Reason</label>
                  <div className="field-shell items-start">
                    <textarea
                      required
                      value={leaveForm.reason}
                      onChange={(event) => setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))}
                      placeholder="Briefly explain why you need leave..."
                    />
                  </div>
                </div>

                <button type="submit" disabled={leaveSubmitting} className="primary-button w-full justify-center py-4 text-base disabled:opacity-70">
                  {leaveSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Leave Request
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="metric-card p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Pending</p>
                  <p className="mt-3 text-3xl font-extrabold text-amber-600">{leaveSummary.pending}</p>
                </div>
                <div className="metric-card p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Approved</p>
                  <p className="mt-3 text-3xl font-extrabold text-emerald-600">{leaveSummary.approved}</p>
                </div>
                <div className="metric-card p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Rejected</p>
                  <p className="mt-3 text-3xl font-extrabold text-rose-600">{leaveSummary.rejected}</p>
                </div>
              </div>

              <div className="table-shell">
                <div className="flex items-center gap-3 border-b border-slate-100 px-8 py-6">
                  <CalendarRange className="h-5 w-5 text-cyan-700" />
                  <h2 className="text-2xl font-extrabold text-slate-900">My Leave Requests</h2>
                </div>

                <div className="space-y-4 p-6">
                  {staffLeaves.length === 0 ? (
                    <div className="metric-card rounded-[1.6rem] px-5 py-10 text-center">
                      <p className="text-base font-bold text-slate-900">No leave requests yet</p>
                      <p className="mt-2 text-sm text-slate-500">Your submitted leave applications will appear here.</p>
                    </div>
                  ) : (
                    staffLeaves.slice(0, 6).map((leave) => (
                      <div key={leave._id} className="metric-card rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-extrabold text-slate-900">{leave.leaveType}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{leave.reason}</p>
                          </div>
                          <div className="space-y-2 text-right">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase ${getLeaveStatusClass(leave.status)}`}>
                              {leave.status}
                            </span>
                            <p className="text-sm font-semibold text-slate-500">{leave.numberOfDays} day(s)</p>
                          </div>
                        </div>

                        {leave.rejectionReason && (
                          <div className="mt-4 rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-3">
                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-rose-500">Rejection Reason</p>
                            <p className="mt-2 text-sm text-rose-700">{leave.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className={`fixed bottom-8 right-8 z-[100] rounded-[1.3rem] px-5 py-4 text-sm font-bold text-white shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
