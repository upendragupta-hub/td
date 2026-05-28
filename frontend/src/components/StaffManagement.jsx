import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, X, Check, ChevronDown, User, Mail, Phone, 
  Briefcase, Calendar, DollarSign, Clock, Users, Eye, Download
} from 'lucide-react';

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Nurse',
    joiningDate: '',
    baseSalary: '',
    shiftId: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    bankDetails: { accountNumber: '', bankName: '', ifscCode: '' },
    emergencyContact: { name: '', relation: '', phone: '' }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [toast, setToast] = useState(null);

  const roles = ['Doctor', 'Nurse', 'Ward Boy', 'Receptionist', 'Lab Technician', 'Pharmacist'];

  useEffect(() => {
    fetchStaff();
    fetchShifts();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      showToast('Error fetching staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await axios.get('/api/shifts');
      setShifts(response.data.data || response.data); // दोनों फॉर्मेट को हैंडल करता है
    } catch (error) {
      showToast('Error fetching shifts', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // डेटा को साफ़ करें (Clean Data): 400 Bad Request से बचने के लिए
    const submissionData = JSON.parse(JSON.stringify(formData)); // Deep clone

    // डेटा टाइप ठीक करें
    submissionData.baseSalary = submissionData.baseSalary ? Number(submissionData.baseSalary) : 0;

    // Note: shiftId अनिवार्य है, इसलिए इसे यहाँ से delete न करें
    if (!submissionData.joiningDate || submissionData.joiningDate === '') delete submissionData.joiningDate;

    // Nested objects (Address, etc.) चेक करें: अगर सब खाली हैं तो उस ऑब्जेक्ट को ही हटा दें
    ['address', 'bankDetails', 'emergencyContact'].forEach(key => {
      const obj = submissionData[key];
      if (obj && Object.values(obj).every(v => v === '' || v === null)) {
        delete submissionData[key];
      }
    });

    try {
      if (selectedStaff) {
        await axios.put(`/api/staff/${selectedStaff._id}`, submissionData);
        showToast('Staff updated successfully', 'success');
      } else {
        await axios.post(`/api/staff`, submissionData);
        showToast('Staff created successfully', 'success');
      }
      setShowForm(false);
      setSelectedStaff(null);
      setFormData({
        name: '', email: '', phone: '', role: 'Nurse', joiningDate: '',
        baseSalary: '', shiftId: '', address: { street: '', city: '', state: '', zipCode: '' },
        bankDetails: { accountNumber: '', bankName: '', ifscCode: '' },
        emergencyContact: { name: '', relation: '', phone: '' }
      });
      fetchStaff();
    } catch (error) {
      console.error("Staff Save Error Details:", error.response?.data); // यहाँ चेक करें असली वजह
      // टोस्ट में बैकएंड से आया असली एरर दिखाएं
      showToast(error.response?.data?.error || error.response?.data?.message || 'Error saving staff', 'error');
    }
  };

  const handleEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      joiningDate: staffMember.joiningDate?.split('T')[0] || '',
      baseSalary: staffMember.baseSalary,
      shiftId: staffMember.shiftId?._id || '',
      address: staffMember.address || {},
      bankDetails: staffMember.bankDetails || {},
      emergencyContact: staffMember.emergencyContact || {}
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to terminate this staff member?')) {
      try {
        await axios.delete(`/api/staff/${id}`);
        showToast('Staff terminated successfully', 'success');
        fetchStaff();
      } catch (error) {
        showToast('Error terminating staff', 'error');
      }
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || s.role === filterRole;
    return matchesSearch && matchesRole;
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
                <Users className="w-10 h-10 text-blue-600" />
                Staff Management
              </h1>
              <p className="text-gray-600 mt-2">Manage hospital staff profiles and records</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedStaff(null);
                setFormData({
                  name: '', email: '', phone: '', role: 'Nurse', joiningDate: '',
                  baseSalary: '', shiftId: '', address: {}, bankDetails: {}, emergencyContact: {}
                });
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full flex items-center gap-2 font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Staff Member
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Roles</option>
              {roles.map(role => <option key={role}>{role}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Staff List */}
        <div className="grid gap-6">
          {loading ? (
            <motion.div className="text-center py-12">
              <p className="text-gray-600">Loading staff...</p>
            </motion.div>
          ) : filteredStaff.length === 0 ? (
            <motion.div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No staff members found</p>
            </motion.div>
          ) : (
            filteredStaff.map((staffMember, index) => (
              <motion.div
                key={staffMember._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-gray-900">{staffMember.name}</h3>
                    <p className="text-blue-600 font-semibold mt-1">{staffMember.role}</p>
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {staffMember.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {staffMember.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Joined: {new Date(staffMember.joiningDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">Salary</div>
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{staffMember.baseSalary?.toLocaleString() || '0'}
                      </div>
                      {staffMember.shiftId && (
                        <div className="mt-3 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            {staffMember.shiftId.name} Shift
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(staffMember)}
                        className="flex items-center justify-center gap-2 bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(staffMember._id)}
                        className="flex items-center justify-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center gap-2 bg-green-100 text-green-600 hover:bg-green-200 px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email*</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone*</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role*</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {roles.map(role => <option key={role}>{role}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date*</label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Base Salary*</label>
                      <input
                        type="number"
                        name="baseSalary"
                        value={formData.baseSalary}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Shift*</label>
                      <select
                        name="shiftId"
                        value={formData.shiftId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {shifts.length === 0 ? (
                          <option value="">No shifts found. Create one first!</option>
                        ) : (
                          <>
                            <option value="">Select Shift</option>
                            {shifts.map(shift => (
                              <option key={shift._id} value={shift._id}>
                                {shift.name} ({shift.startTime} - {shift.endTime})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="address.street"
                        placeholder="Street"
                        value={formData.address.street || ''}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="address.city"
                        placeholder="City"
                        value={formData.address.city || ''}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="address.state"
                        placeholder="State"
                        value={formData.address.state || ''}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="address.zipCode"
                        placeholder="Zip Code"
                        value={formData.address.zipCode || ''}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6 flex gap-4 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {selectedStaff ? 'Update' : 'Create'} Staff
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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

export default StaffManagement;
