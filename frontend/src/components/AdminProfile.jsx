import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Mail, ShieldCheck, KeyRound, Save, Edit, XCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminProfile() {
  const { admin, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '' });
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (admin) setFormData({ username: admin.username, email: admin.email });
  }, [admin]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await updateProfile(formData);
    if (res.success) {
      setMessage({ type: 'success', text: 'Admin profile updated' });
      setEditMode(false);
    } else {
      setMessage({ type: 'error', text: res.error });
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900">Admin Profile</h2>
        <p className="text-slate-500">Manage your administrative credentials and security</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20}/></div>
                <h3 className="font-bold text-lg">General Information</h3>
              </div>
              <button onClick={() => setEditMode(!editMode)} className="text-sm font-bold text-blue-600">
                {editMode ? 'Cancel' : 'Edit Info'}
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1">Username</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  readOnly={!editMode}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  readOnly={!editMode}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              {editMode && (
                <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                  <Save size={18}/> Save Changes
                </button>
              )}
            </form>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg"><KeyRound size={20}/></div>
              <h3 className="font-bold text-lg">Security</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Regularly updating your password ensures account safety.</p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all">
                Request Password Reset
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={40} />
            </div>
            <h4 className="font-bold text-xl mb-1">Status: Active</h4>
            <p className="text-blue-100 text-sm">Role: {admin?.role}</p>
            <div className="mt-6 pt-6 border-t border-white/10 text-xs text-blue-200">
              Member since {new Date(admin?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}