import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, PlusCircle, Edit, Trash2, User, Mail, Phone, Calendar, X, 
  Search, Filter, CheckCircle2, AlertCircle, Loader2, ArrowUpDown, ArrowLeft,
  MapPin, Clock, Award
} from 'lucide-react';
import axios from 'axios';

// Re-defining Modal and Toast for self-containment in this component for demonstration.
// In a real project, these would typically be shared UI components imported from a common library.
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
    error: <AlertCircle className="w-5 h-5" />,
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

const SPECIALTIES = ['All', 'Cardiology', 'Pediatrics', 'Neurology', 'Oncology', 'Dermatology', 'General Medicine'];

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null); // Doctor being edited
  const [selectedDoctor, setSelectedDoctor] = useState(null); // Doctor for detail view
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for form submission loading
  const [formData, setFormData] = useState({ 
    name: '', 
    specialty: 'General Medicine', 
    email: '', 
    phone: '', 
    schedule: '',
    experience: '',
    image: '' 
  });
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('All');

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/doctors'); // Assuming this endpoint exists
      setDoctors(response.data.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Failed to load doctors.');
      showToast('Failed to load doctors.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Set submitting state
    
    // Ensure an image exists if the backend requires it
    const submissionData = {
      ...formData,
      image: formData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name.replace(/\s/g, '')}`
    };

    try {
      if (currentDoctor) {
        // Edit existing doctor
        await axios.put(`/api/doctors/${currentDoctor._id}`, submissionData);
        showToast('Doctor updated successfully!', 'success');
      } else {
        // Add new doctor
        await axios.post('/api/doctors', submissionData);
        showToast('Doctor added successfully!', 'success');
      }
      fetchDoctors(); // Refresh list
      closeModal();
    } catch (err) {
      console.error('Error saving doctor:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save doctor.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await axios.delete(`/api/doctors/${id}`);
      showToast('Doctor deleted successfully!', 'success');
      setDoctors(doctors.filter(doc => doc._id !== id));
    } catch (err) {
      console.error('Error deleting doctor:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to delete doctor.';
      showToast(errorMessage, 'error');
    }
  };

  const openAddModal = () => {
    setCurrentDoctor(null);
    setFormData({ name: '', specialty: 'General Medicine', email: '', phone: '', schedule: '', image: '' });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (doctor) => {
    setCurrentDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialty: doctor.specialty,
      email: doctor.email,
      phone: doctor.phone,
      schedule: doctor.schedule || '',
      experience: doctor.experience || '',
      image: doctor.image || ''
    });
    setIsAddEditModalOpen(true);
  };

  const closeModal = () => {
    setIsAddEditModalOpen(false);
    setCurrentDoctor(null);
    setFormData({ name: '', specialty: 'General Medicine', email: '', phone: '', schedule: '', experience: '', image: '' });
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = filterSpecialty === 'All' || doctor.specialty === filterSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {selectedDoctor ? (
        // Detail View
        <div className="space-y-6">
          <button
            onClick={() => setSelectedDoctor(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Doctors
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Profile Image Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-8 border border-blue-100 flex flex-col items-center text-center">
                  {selectedDoctor.image ? (
                    <img 
                      src={selectedDoctor.image} 
                      alt={selectedDoctor.name}
                      className="w-40 h-40 rounded-2xl object-cover border-4 border-white shadow-lg mb-6"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : null}
                  <div className={`w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-6xl font-bold shadow-lg mb-6 ${selectedDoctor.image ? 'hidden' : ''}`}>
                    {selectedDoctor.name[0]}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">{selectedDoctor.name}</h1>
                  <p className="text-blue-600 font-semibold mt-2 text-lg">{selectedDoctor.specialty}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      openEditModal(selectedDoctor);
                      setSelectedDoctor(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this doctor?')) {
                        handleDeleteDoctor(selectedDoctor._id);
                        setSelectedDoctor(null);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl font-semibold hover:bg-rose-100 transition-colors border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-md p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Professional Information</h2>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Specialty</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">{selectedDoctor.specialty}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="bg-emerald-100 p-3 rounded-xl">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Schedule</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">{selectedDoctor.schedule}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-md p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Information</h2>
                
                <div className="space-y-5">
                  <a
                    href={`mailto:${selectedDoctor.email}`}
                    className="flex items-start gap-4 p-4 hover:bg-blue-50 rounded-2xl transition-colors group cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                  >
                    <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Email</p>
                      <p className="text-lg font-semibold text-blue-600 group-hover:text-blue-700 mt-1">{selectedDoctor.email}</p>
                    </div>
                  </a>

                  <a
                    href={`tel:${selectedDoctor.phone}`}
                    className="flex items-start gap-4 p-4 hover:bg-green-50 rounded-2xl transition-colors group cursor-pointer border-l-4 border-transparent hover:border-green-500"
                  >
                    <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Phone</p>
                      <p className="text-lg font-semibold text-green-600 group-hover:text-green-700 mt-1">{selectedDoctor.phone}</p>
                    </div>
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ) : (
        // Grid View
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Stethoscope size={32} className="text-blue-600" />
              Doctor Management
            </h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
            >
              <PlusCircle className="w-5 h-5" />
              Add New Doctor
            </button>
          </div>
          <p className="text-slate-600">Manage your hospital's medical staff and their schedules.</p>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700"
              />
            </div>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-700 bg-white"
            >
              {SPECIALTIES.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-slate-500 text-lg">Loading doctors...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-rose-500">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg">{error}</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No doctors found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredDoctors.map((doctor) => (
                  <motion.div
                    key={doctor._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
                    onClick={() => setSelectedDoctor(doctor)}
                    className="cursor-pointer bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group"
                  >
                    {/* Card Header */}
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-sky-600 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                      </div>
                    </div>

                    {/* Card Avatar */}
                    <div className="px-6 pb-4 -mt-12 relative z-10">
                      <div className="flex gap-4 items-end mb-4">
                        <div>
                          {doctor.image ? (
                            <img 
                              src={doctor.image} 
                              alt={doctor.name}
                              className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          ) : null}
                          <div className={`w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg ${doctor.image ? 'hidden' : ''}`}>
                            {doctor.name[0]}
                          </div>
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <h3 className="text-xl font-bold text-slate-900">{doctor.name}</h3>
                      <p className="text-blue-600 font-semibold text-sm mt-1">{doctor.specialty}</p>
                    </div>

                    {/* Card Content */}
                    <div className="px-6 py-4 space-y-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-600 text-sm group/email hover:text-blue-600 transition-colors">
                        <Mail className="w-4 h-4 text-slate-400 group-hover/email:text-blue-500" />
                        <a href={`mailto:${doctor.email}`} className="truncate hover:underline">{doctor.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm group/phone hover:text-green-600 transition-colors">
                        <Phone className="w-4 h-4 text-slate-400 group-hover/phone:text-green-500" />
                        <a href={`tel:${doctor.phone}`} className="hover:underline">{doctor.phone}</a>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{doctor.schedule}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(doctor);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 text-sm font-semibold"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoctor(doctor._id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors border border-rose-200 text-sm font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isAddEditModalOpen}
        onClose={closeModal}
        title={currentDoctor ? 'Edit Doctor' : 'Add New Doctor'}
      >
        <form onSubmit={handleAddEditSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Dr. John Doe"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Specialty</label>
            <select
              name="specialty"
              value={formData.specialty}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
            >
              {SPECIALTIES.filter(s => s !== 'All').map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="john.doe@wecare.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Schedule (e.g., Mon-Fri 9AM-5PM)</label>
            <input
              type="text"
              name="schedule"
              value={formData.schedule}
              onChange={handleFormChange}
              placeholder="Mon-Fri 9AM-5PM"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (e.g., 10+ Years)</label>
            <input
              type="text"
              name="experience"
              value={formData.experience}
              onChange={handleFormChange}
              placeholder="10+ Years"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Image URL (Optional)</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleFormChange}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 bg-blue-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              currentDoctor ? 'Update Doctor' : 'Add Doctor'
            )}
          </button>
        </form>
      </Modal>
    </motion.div>
  );
}
