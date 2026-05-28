import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Trash2, Clock, Calendar as CalendarIcon, User, RefreshCcw, Mail, LayoutDashboard,
  Search, Filter, Download, ChevronLeft, ChevronRight, Eye, AlertCircle,
  CheckCircle2, XCircle, Loader2, ArrowUpDown, FileText, LogOut, Settings,
   UserCircle,
  Stethoscope, Bed, Receipt, Users as UsersIcon, HeartPulse, Pill, DollarSign, TrendingUp, Ambulance
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminProfile from './AdminProfile';
// Import new management components
import DoctorManagement from './DoctorManagement';
import BedManagement from './BedManagement';
import BillingPharmacy from './BillingPharmacy';
import MedicineManagement from './MedicineManagement';
import BloodBankManagement from './BloodBankManagement';
import AmbulanceManagement from './AmbulanceManagement';
import UserManagement from './UserManagement';
import StaffManagement from './StaffManagement';
import ShiftManagement from './ShiftManagement';
import AttendanceTracking from './AttendanceTracking';
import LeaveManagement from './LeaveManagement';
import PayrollManagement from './PayrollManagement';
import ReportsAnalytics from './ReportsAnalytics';

import StaffPortal from './StaffPortal';
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white ${bgColors[type] || bgColors.info}`}
    >
      {icons[type]}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Loading Skeleton Component (Copied from UserDashboard.jsx and adapted)
function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-200" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-40 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          </td>
          <td className="px-8 py-6">
            <div className="space-y-2">
              <div className="w-28 h-4 bg-slate-200 rounded" />
              <div className="w-24 h-3 bg-slate-100 rounded" />
            </div>
          </td>
          <td className="px-8 py-6">
            <div className="w-24 h-7 bg-slate-200 rounded-full" />
          </td>
          <td className="px-8 py-6">
            <div className="flex gap-2">
              <div className="w-9 h-9 bg-slate-200 rounded-xl" />
              <div className="w-9 h-9 bg-slate-200 rounded-xl" />
              <div className="w-9 h-9 bg-slate-200 rounded-xl" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// Modal Component (Copied from UserDashboard.jsx and adapted)
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-2xl font-display font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Stat Card Component (Copied from UserDashboard.jsx and adapted)
function StatCard({ title, value, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', fill: 'bg-blue-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', fill: 'bg-amber-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', fill: 'bg-emerald-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', fill: 'bg-rose-500' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', fill: 'bg-slate-500' },
  };

  const colors = colorClasses[color] || colorClasses.slate;

  return (
    <motion.div 
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
          <p className="text-4xl font-display font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 font-medium ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last week
            </p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center border ${colors.border}`}>
          <Icon className={`w-7 h-7 ${colors.text}`} />
        </div>
      </div>
    </motion.div>
  );
}

const DEPARTMENTS = [
  'All Departments',
  'Cardiology',
  'Pediatrics',
  'Neurology',
  'Emergency Care',
  'General Medicine',
  'Dermatology',
  'Oncology'
];

const STATUS_OPTIONS = ['All Status', 'Pending', 'Confirmed', 'Cancelled'];

const ITEMS_PER_PAGE = 10;
const PAGE_OPTIONS = [5, 10, 25, 50];

export default function AdminDashboard() {
  const { admin, logout } = useAuth(); // Use admin context
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Sorting states
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Admin fetches all appointments
      const response = await axios.get('/api/appointments/admin'); 
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error(err);
      showToast('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) { // Only fetch if admin is logged in
      fetchAppointments();
    }
  }, [admin]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter, dateFrom, dateTo]);

  // Filtered and sorted appointments
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.department.toLowerCase().includes(query) ||
        (app.message && app.message.toLowerCase().includes(query))
      );
    }

    // Department filter
    if (departmentFilter !== 'All Departments') {
      result = result.filter(app => app.department === departmentFilter);
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      result = result.filter(app => 
        app.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(app => new Date(app.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(app => new Date(app.date) <= to);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'date' || sortField === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [appointments, searchQuery, departmentFilter, statusFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Paginated appointments
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  // Stats calculation for admin dashboard
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter(a => a.status.toLowerCase() === 'pending').length;
    const confirmed = appointments.filter(a => a.status.toLowerCase() === 'confirmed').length;
    const cancelled = appointments.filter(a => a.status.toLowerCase() === 'cancelled').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppointments = appointments.filter(a => {
      const appDate = new Date(a.date);
      return appDate >= today;
    }).length;

    return { total, pending, confirmed, cancelled, today: todayAppointments };
  }, [appointments]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await axios.patch(`/api/appointments/${id}`, { status: newStatus });
      if (response.data.success) {
        setAppointments(prev => prev.map(app => 
          app._id === id ? response.data.data : app
        ));

        let message = `Appointment ${newStatus.toLowerCase()} successfully`;
        const emailNotification = response.data.notifications?.email;

        if (newStatus.toLowerCase() === 'confirmed' && emailNotification) {
          message = emailNotification.sent
            ? `${message}. Confirmation email sent.`
            : `${message}. Email not sent: ${emailNotification.reason}.`;
        }

        showToast(message, 'success');
      }
    } catch (err) {
      console.error('Update failed:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this appointment record?')) return;
    try {
      await axios.delete(`/api/appointments/${id}`);
      setAppointments(prev => prev.filter(app => !selectedIds.has(app._id)));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      showToast('Appointment deleted successfully', 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Failed to delete record', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} appointment(s)?`)) return;
    
    try {
      await Promise.all(Array.from(selectedIds).map(id => 
        axios.delete(`/api/appointments/${id}`)
      ));
      setAppointments(prev => prev.filter(app => !selectedIds.has(app._id)));
      setSelectedIds(new Set());
      setIsSelectAll(false);
      showToast(`${selectedIds.size} appointments deleted`, 'success');
    } catch (err) {
      console.error('Bulk delete failed:', err);
      showToast('Failed to delete some appointments', 'error');
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedIds.size === 0) return;
    
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        axios.patch(`/api/appointments/${id}`, { status: newStatus })
      ));
      setAppointments(prev => prev.map(app =>
        selectedIds.has(app._id) ? { ...app, status: newStatus } : app
      ));
      setSelectedIds(new Set());
      setIsSelectAll(false);
      showToast(`${selectedIds.size} appointments ${newStatus.toLowerCase()}`, 'success');
    } catch (err) {
      console.error('Bulk update failed:', err);
      showToast('Failed to update some appointments', 'error');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Department', 'Date', 'Status', 'Message', 'Created At'];
    const rows = filteredAppointments.map(app => [
      app.name,
      app.email,
      app.department,
      new Date(app.date).toLocaleDateString(),
      app.status,
      `"${(app.message || '').replace(/"/g, '""')}"`,
      new Date(app.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Export completed successfully', 'success');
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(paginatedAppointments.map(app => app._id)));
      setIsSelectAll(true);
    } else {
      setSelectedIds(new Set());
      setIsSelectAll(false);
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const openAppointmentDetails = (app) => {
    setSelectedAppointment(app);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('All Departments');
    setStatusFilter('All Status');
    setDateFrom('');
    setDateTo('');
    setSortField('createdAt');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || departmentFilter !== 'All Departments' || 
    statusFilter !== 'All Status' || dateFrom || dateTo;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
    { id: 'staff', label: 'Staff Management', icon: User },
    { id: 'shifts', label: 'Shift Management', icon: Clock },
    { id: 'attendance', label: 'Attendance Tracking', icon: Clock },
    { id: 'leave', label: 'Leave Management', icon: CalendarIcon },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'doctors', label: 'Doctor Management', icon: Stethoscope },
    { id: 'beds', label: 'Bed Management', icon: Bed },
    { id: 'medicine', label: 'Medicine Stock', icon: Pill },
    { id: 'ambulance', label: 'Ambulance Ops', icon: Ambulance },
    { id: 'billing', label: 'Billing & Pharmacy', icon: Receipt },
    { id: 'blood', label: 'Blood Bank', icon: HeartPulse },
    { id: 'users', label: 'User Management', icon: UsersIcon },
    { id: 'staff-portal', label: 'Staff Portal (Demo)', icon: UserCircle },
    { id: 'profile', label: 'Admin Profile', icon: Settings }
  ];

  const activeMenu = menuItems.find((item) => item.id === activeTab);

  // Render functions for each tab
  const renderDashboard = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-800">Welcome, {admin?.username}</h2>
      {/* Stats Cards adapted for admin view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Appointments" value={stats.total} icon={CalendarIcon} color="blue" />
        <StatCard title="Pending Appointments" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Confirmed Appointments" value={stats.confirmed} icon={CheckCircle2} color="emerald" />
        <StatCard title="Cancelled Appointments" value={stats.cancelled} icon={XCircle} color="rose" />
      </div>
      {/* Quick links or summary of other sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setActiveTab('doctors')}
          className="w-full py-6 bg-white border-2 border-dashed border-blue-200 rounded-3xl text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-3"
        >
          <Stethoscope /> Manage Doctors
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className="w-full py-6 bg-white border-2 border-dashed border-emerald-200 rounded-3xl text-emerald-600 font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-3"
        >
          <UsersIcon /> Manage Users
        </button>
      </div>
    </div>
  );

  const renderAppointmentsTable = () => (
    <>
      {/* Filters Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700 bg-white"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700 bg-white"
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700"
              placeholder="To"
            />
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {departmentFilter !== 'All Departments' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {departmentFilter}
                <button onClick={() => setDepartmentFilter('All Departments')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'All Status' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {statusFilter}
                <button onClick={() => setStatusFilter('All Status')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                From: {new Date(dateFrom).toLocaleDateString()}
                <button onClick={() => setDateFrom('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                To: {new Date(dateTo).toLocaleDateString()}
                <button onClick={() => setDateTo('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-500 text-sm">
          Showing {paginatedAppointments.length} of {filteredAppointments.length} appointments
        </p>
        {selectedIds.size > 0 && (
          <p className="text-blue-600 text-sm font-medium">
            {selectedIds.size} selected
          </p>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">
                  <input
                    type="checkbox"
                    checked={isSelectAll && paginatedAppointments.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th 
                  className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Patient Profile
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Details
                </th>
                <th 
                  className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableSkeleton />
                ) : (
                  paginatedAppointments.map((app) => (
                    <motion.tr 
                      layout
                      key={app._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className={`group hover:bg-slate-50/80 transition-all ${
                        selectedIds.has(app._id) ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-6">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app._id)}
                          onChange={(e) => handleSelectOne(app._id, e.target.checked)}
                          className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-100">
                            {app.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">{app.name}</p>
                            <p className="text-sm text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {app.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-slate-600">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 font-medium">
                            <User className="w-4 h-4 text-blue-500" /> {app.department}
                          </div>
                          {app.message && (
                            <p className="text-sm text-slate-400 line-clamp-1" title={app.message}>
                              {app.message}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm border ${
                          app.status.toLowerCase() === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          app.status.toLowerCase() === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            app.status.toLowerCase() === 'confirmed' ? 'bg-emerald-500' :
                            app.status.toLowerCase() === 'cancelled' ? 'bg-rose-500' :
                            'bg-amber-500'
                          }`} />
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-6 text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-slate-300" />
                          {new Date(app.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex gap-2">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openAppointmentDetails(app)}
                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100" 
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          {app.status.toLowerCase() === 'pending' && (
                            <>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusUpdate(app._id, 'Confirmed')} 
                                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100" 
                                title="Confirm Appointment"
                              >
                                <Check className="w-4 h-4" />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusUpdate(app._id, 'Cancelled')} 
                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors border border-slate-100" 
                                title="Cancel Appointment"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </>
                          )}
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(app._id)} 
                            className="p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-slate-100" 
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
          
          {!loading && paginatedAppointments.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium">No appointment records found.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters to see all appointments
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700 bg-white text-sm"
            >
              {PAGE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center justify-between"
        >
          <span className="text-blue-700 font-medium">
            {selectedIds.size} appointment(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusUpdate('Confirmed')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium text-sm"
            >
              Confirm Selected
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('Cancelled')}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium text-sm"
            >
              Cancel Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium text-sm"
            >
              Delete Selected
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setIsSelectAll(false); }}
              className="px-4 py-2 bg-white text-slate-600 rounded-xl hover:bg-slate-100 transition-colors font-medium text-sm border border-slate-200"
            >
              Deselect All
            </button>
          </div>
        </motion.div>
      )}

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedAppointment(null); }}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
                {selectedAppointment.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedAppointment.name}</h3>
                <p className="text-slate-500 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {selectedAppointment.email}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                <p className="font-semibold text-slate-900">{selectedAppointment.department}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Appointment Date</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedAppointment.date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                  selectedAppointment.status.toLowerCase() === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  selectedAppointment.status.toLowerCase() === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {selectedAppointment.status}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created At</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedAppointment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Message */}
            {selectedAppointment.message && (
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message</p>
                <p className="text-slate-700">{selectedAppointment.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              {selectedAppointment.status.toLowerCase() === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedAppointment._id, 'Confirmed');
                      setIsModalOpen(false);
                    }}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Confirm Appointment
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedAppointment._id, 'Cancelled');
                      setIsModalOpen(false);
                    }}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel Appointment
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  handleDelete(selectedAppointment._id);
                  setIsModalOpen(false);
                }}
                className="flex-1 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );

  // Placeholder render functions for new features
  const renderStaffManagement = () => <StaffManagement />;
  const renderShiftManagement = () => <ShiftManagement />;
  const renderAttendanceTracking = () => <AttendanceTracking />;
  const renderLeaveManagement = () => <LeaveManagement />;
  const renderPayrollManagement = () => <PayrollManagement />;
  const renderReportsAnalytics = () => <ReportsAnalytics />;
  const renderDoctorManagement = () => <DoctorManagement />;
  const renderBedManagement = () => <BedManagement />;
  const renderMedicineManagement = () => <MedicineManagement />;
  const renderAmbulanceManagement = () => <AmbulanceManagement mode="admin" />;
  const renderBillingPharmacy = () => <BillingPharmacy />;
  const renderBloodBankManagement = () => {
    console.log("AdminDashboard: Rendering BloodBankManagement component.");
    return <BloodBankManagement />;
  };
  const renderUserManagement = () => <UserManagement />;
  const renderStaffPortal = () => <StaffPortal />;

  if (!admin) return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="surface-panel-strong rounded-[2rem] p-12">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Access Denied</h2>
        <p className="text-slate-600 mb-8">
          You must be logged in as an administrator to access this panel.
        </p>
      </motion.div>
    </div>
  );

  if (loading && appointments.length === 0 && activeTab === 'appointments') return (
    <div className="surface-panel-strong flex min-h-[320px] items-center justify-center rounded-[2rem]">
      <div className="text-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
          className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-700 rounded-full mx-auto mb-4" 
        />
        <p className="text-cyan-700 font-medium">Loading admin workspace...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="sidebar-shell w-full p-4 xl:w-80">
        <div className="rounded-[1.8rem] bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 px-5 py-6 text-white shadow-lg shadow-cyan-500/20">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">Admin Workspace</p>
          <h2 className="mt-3 text-2xl font-extrabold">{admin?.username || 'Administrator'}</h2>
          <p className="mt-2 text-sm text-cyan-50/90">Manage appointments, staff, and operations in one place.</p>
        </div>

        <div className="mt-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'text-slate-500 hover:bg-white/90'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <button
            onClick={logout} // Admin logout
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="surface-dark rounded-[2rem] px-6 py-7 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">{activeMenu?.label}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white">Run hospital operations with a clearer control panel.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
            Switch between appointments, staffing, inventory, payroll, and reporting without losing context.
          </p>
        </div>

        <div className="dashboard-panel min-h-[70vh] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'appointments' && renderAppointmentsTable()}
              {activeTab === 'doctors' && renderDoctorManagement()}
              {activeTab === 'beds' && renderBedManagement()}
              {activeTab === 'medicine' && renderMedicineManagement()}
              {activeTab === 'ambulance' && renderAmbulanceManagement()}
              {activeTab === 'billing' && renderBillingPharmacy()}
              {activeTab === 'blood' && renderBloodBankManagement()}
              {activeTab === 'staff' && renderStaffManagement()}
              {activeTab === 'shifts' && renderShiftManagement()}
              {activeTab === 'attendance' && renderAttendanceTracking()}
              {activeTab === 'leave' && renderLeaveManagement()}
              {activeTab === 'payroll' && renderPayrollManagement()}
              {activeTab === 'reports' && renderReportsAnalytics()}
              {activeTab === 'users' && renderUserManagement()}
              {activeTab === 'staff-portal' && renderStaffPortal()}
              {activeTab === 'profile' && <AdminProfile />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
