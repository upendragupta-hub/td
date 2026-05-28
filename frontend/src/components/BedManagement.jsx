import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bed, PlusCircle, Search, Filter, Trash2, Edit, X, 
  CheckCircle2, AlertCircle, Loader2, Info, UserCheck, 
  Activity, Building2, MoreVertical
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
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
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

// Local UI Components consistent with the rest of the app
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
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const WARDS = ['All', 'ICU', 'General Ward', 'Emergency', 'Pediatrics', 'Surgery', 'Maternity'];
const STATUSES = ['Available', 'Occupied', 'Maintenance'];

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated: isAdmin } = useAuth();
  const [currentBed, setCurrentBed] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [admissionBedId, setAdmissionBedId] = useState(null);
  const [admissionPatientName, setAdmissionPatientName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWard, setFilterWard] = useState('All');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const [formData, setFormData] = useState({
    bedNumber: '',
    ward: 'General Ward',
    status: 'Available',
    type: 'Standard',
    patientName: '' // Temporarily add patientName for display purposes
  });

  const fetchBeds = async () => {
    setLoading(true);
    try {
      // Assuming /api/beds endpoint exists
      const response = await axios.get('/api/beds');
      setBeds(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch beds:', err);
      // Fallback data for demonstration if API is not yet ready
      setBeds([
        { _id: '1', bedNumber: 'B-101', ward: 'ICU', status: 'Occupied', type: 'Electronic', patientName: 'Alice Smith' },
        { _id: '2', bedNumber: 'B-102', ward: 'ICU', status: 'Available', type: 'Electronic', patientName: '' },
        { _id: '3', bedNumber: 'G-201', ward: 'General Ward', status: 'Available', type: 'Standard', patientName: '' },
        { _id: '4', bedNumber: 'E-001', ward: 'Emergency', status: 'Maintenance', type: 'Standard', patientName: '' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);
  
  const handleAdmissionFormChange = (e) => {
    setAdmissionPatientName(e.target.value);
  };
  
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentBed) {
        await axios.put(`/api/beds/${currentBed._id}`, { ...formData, patientName: formData.status === 'Available' ? '' : formData.patientName }); // Clear patientName if status is Available
        showToast('Bed updated successfully!', 'success');
      } else {
        await axios.post('/api/beds', formData);
        showToast('Bed registered successfully!', 'success');
      }
      fetchBeds();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving bed:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to save bed details.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Update bed status to Occupied and assign patient name (for display)
      await axios.put(`/api/beds/${admissionBedId}`, { status: 'Occupied', patientName: admissionPatientName });
      showToast(`Patient ${admissionPatientName} admitted to bed ${beds.find(b => b._id === admissionBedId)?.bedNumber}.`, 'success');
      fetchBeds();
      setIsAdmissionModalOpen(false);
      setAdmissionPatientName('');
      setAdmissionBedId(null);
    } catch (err) {
      console.error('Error admitting patient:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to admit patient.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDischargePatient = async (bedId) => {
    if (!window.confirm('Are you sure you want to discharge this patient and make the bed available?')) return;
    try {
      // Update bed status to Available and clear patient name
      await axios.patch(`/api/beds/${bedId}/status`, { status: 'Available', patientName: '' });
      showToast('Patient discharged and bed is now available.', 'success');
      fetchBeds();
      setIsPatientDetailsModalOpen(false);
      setSelectedOccupiedBed(null);
    } catch (err) {
      console.error('Error discharging patient:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to discharge patient.';
      showToast(errorMessage, 'error');
    }

  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this bed?')) return;
    try {
      await axios.delete(`/api/beds/${id}`);
      setBeds(beds.filter(b => b._id !== id));
      showToast('Bed removed successfully.', 'success');
    } catch (err) {
      console.error('Error deleting bed:', err);
      showToast('Failed to delete bed.', 'error');
    }
  };

  const handleEditClick = (e, bed) => {
    e.stopPropagation();
    openModal(bed);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    handleDelete(id);
  };

  const openModal = (bed = null) => {
    if (bed) {
      setCurrentBed(bed);
      setFormData({
        bedNumber: bed.bedNumber,
        ward: bed.ward,
        status: bed.status,
        type: bed.type,
        patientName: bed.patientName || '' // Populate patientName if editing an occupied bed
      });
    } else {
      setCurrentBed(null);
      setFormData({ bedNumber: '', ward: 'General Ward', status: 'Available', type: 'Standard', patientName: '' });
    }
    setIsModalOpen(true);
  };

  const [isPatientDetailsModalOpen, setIsPatientDetailsModalOpen] = useState(false);
  const [selectedOccupiedBed, setSelectedOccupiedBed] = useState(null);

  const handleBedCardClick = (bed) => {
    if (bed.status === 'Available') {
      setAdmissionBedId(bed._id);
      setIsAdmissionModalOpen(true);
    } else if (bed.status === 'Occupied') {
      setSelectedOccupiedBed(bed);
      setIsPatientDetailsModalOpen(true);
    }
  };

  const filteredBeds = useMemo(() => {
    return beds.filter(bed => {
      const matchesSearch = bed.bedNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWard = filterWard === 'All' || bed.ward === filterWard;
      return matchesSearch && matchesWard;
    });
  }, [beds, searchQuery, filterWard]);

  const stats = useMemo(() => {
    return {
      total: beds.length,
      available: beds.filter(b => b.status === 'Available').length, // Only count truly available beds
      occupied: beds.filter(b => b.status === 'Occupied').length
    };
  }, [beds]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Bed size={32} className="text-emerald-600" />
            Bed Management
          </h2>
          <p className="text-slate-600">Monitor and manage hospital bed occupancy and availability in real-time.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md w-full md:w-auto justify-center"
          >
            <PlusCircle className="w-5 h-5" />
            Register New Bed
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Beds</p>
          <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Available</p>
          <h3 className="text-3xl font-bold text-emerald-700">{stats.available}</h3>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Occupied</p>
          <h3 className="text-3xl font-bold text-rose-700">{stats.occupied}</h3>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bed number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 w-full"
            >
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Bed Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading department inventory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <AnimatePresence mode='popLayout'>
            {filteredBeds.map((bed) => (
              <motion.div
                key={bed._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5"
                onClick={() => handleBedCardClick(bed)} // Add click handler for bed cards
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${
                    bed.status === 'Available' ? 'bg-emerald-100 text-emerald-600' :
                    bed.status === 'Occupied' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <Bed size={20} />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEditClick(e, bed)} className="p-1 hover:text-blue-600"><Edit size={14}/></button>
                      <button onClick={(e) => handleDeleteClick(e, bed._id)} className="p-1 hover:text-rose-600"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
                
                <h4 className="font-bold text-slate-900 text-lg">{bed.bedNumber}</h4>
                <p className="text-xs text-slate-400 font-medium uppercase mb-3">{bed.ward}</p>
                {bed.status === 'Occupied' && bed.patientName && (
                  <p className="text-xs text-slate-500 flex items-center gap-1"><UserCheck className="w-3 h-3" /> {bed.patientName}</p>
                )}
                
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    bed.status === 'Available' ? 'bg-emerald-500' :
                    bed.status === 'Occupied' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-xs font-bold text-slate-600">{bed.status}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredBeds.length === 0 && !loading && (
        <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No beds found matching your criteria.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentBed ? 'Edit Bed Info' : 'Register New Bed'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Bed Number</label>
            <input
              type="text"
              name="bedNumber"
              value={formData.bedNumber}
              onChange={handleFormChange}
              required
              placeholder="e.g. B-101"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ward/Unit</label>
              <select
                name="ward"
                value={formData.ward}
                onChange={handleFormChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white"
              >
                {WARDS.filter(w => w !== 'All').map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Bed Type</label>
            <div className="flex gap-4">
              {['Standard', 'Electronic', 'ICU Specialized'].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value={type}
                    checked={formData.type === type}
                    onChange={handleFormChange}
                    className="text-emerald-600"
                  />
                  <span className="text-xs font-medium text-slate-600">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-700 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              currentBed ? 'Update Bed' : 'Register Bed'
            )}
          </button>
        </form>
      </Modal>

      {/* Patient Admission Modal */}
      <Modal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        title={`Admit Patient to Bed ${beds.find(b => b._id === admissionBedId)?.bedNumber}`}
      >
        <form onSubmit={handleAdmitPatient} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Name</label>
            <input
              type="text"
              name="patientName"
              value={admissionPatientName}
              onChange={handleAdmissionFormChange}
              required
              placeholder="e.g. Jane Doe"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          {/* In a real app, you'd have more fields like Patient ID, etc. */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-700 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Admitting...</>
            ) : (
              'Admit Patient'
            )}
          </button>
        </form>
      </Modal>

      {/* Patient Details & Discharge Modal */}
      <Modal
        isOpen={isPatientDetailsModalOpen}
        onClose={() => setIsPatientDetailsModalOpen(false)}
        title={`Bed ${selectedOccupiedBed?.bedNumber} Details`}
      >
        {selectedOccupiedBed && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bed Number</p>
              <p className="font-semibold text-slate-900">{selectedOccupiedBed.bedNumber}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ward</p>
              <p className="font-semibold text-slate-900">{selectedOccupiedBed.ward}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                selectedOccupiedBed.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                selectedOccupiedBed.status === 'Occupied' ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {selectedOccupiedBed.status}
              </span>
            </div>
            {selectedOccupiedBed.status === 'Occupied' && selectedOccupiedBed.patientName && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Occupied By</p>
                <p className="font-semibold text-rose-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> {selectedOccupiedBed.patientName}
                </p>
                {/* In a real app, you'd fetch and display more patient details here */}
              </div>
            )}

            {selectedOccupiedBed.status === 'Occupied' && (
              <button
                onClick={() => handleDischargePatient(selectedOccupiedBed._id)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-blue-700 active:scale-[0.98]"
              >
                <UserCheck className="w-4 h-4" /> Discharge Patient
              </button>
            )}
            {selectedOccupiedBed.status === 'Maintenance' && (
              <p className="text-sm text-slate-500 text-center mt-4">This bed is currently under maintenance.</p>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
