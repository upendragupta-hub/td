import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, Search, Trash2, ShieldCheck, 
  ShieldAlert, Loader2, Mail, Calendar, User, 
  CheckCircle2, AlertCircle, X 
} from 'lucide-react';
import axios from 'axios';

// Local Toast Component for feedback
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white ${bgColors[type] || 'bg-blue-500'}`}
    >
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X size={16} />
      </button>
    </motion.div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users'); 
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showToast(err.response?.data?.message || 'Failed to load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle Active/Inactive status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.patch(`/api/users/${id}/status`, { isActive: !currentStatus });
      if (response.data.success) {
        showToast('User status updated successfully.', 'success');
        setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure? This will permanently delete the patient account.')) return;
    try {
      const response = await axios.delete(`/api/users/${id}`);
      if (response.data.success) {
        showToast('User account removed.', 'success');
        setUsers(users.filter(u => u._id !== id));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Deletion failed.', 'error');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
        <UsersIcon size={32} className="text-orange-600" />
        User Management
      </h2>
      <p className="text-slate-600">Overview of registered patients, monitor activity, and manage account permissions.</p>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all outline-none text-slate-700 bg-white"
          />
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest">
          Total Patients: {users.length}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Profile</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined On</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-slate-500 font-medium">Loading User Records...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 flex items-center justify-center font-black text-lg border border-orange-200/50">
                          {user.username?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">{user.username}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                        {user.role || 'Patient'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.isActive 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className={`p-2 rounded-xl transition-all border ${
                            user.isActive 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                        >
                          {user.isActive ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all border border-slate-100"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-32 text-center">
                    <div className="bg-slate-50 rounded-3xl p-10 border-2 border-dashed border-slate-100 inline-block">
                      <UsersIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium italic">No matching user records.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}