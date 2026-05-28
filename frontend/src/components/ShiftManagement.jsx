import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Check, Clock } from 'lucide-react';

function ShiftManagement() {
  const [shifts, setShifts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [formData, setFormData] = useState({
    name: 'Morning',
    startTime: '',
    endTime: '',
    duration: 8
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await axios.get('/api/shifts');
      setShifts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching shifts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedShift) {
        await axios.put(`/api/shifts/${selectedShift._id}`, formData);
      } else {
        await axios.post('/api/shifts', formData);
      }
      setShowForm(false);
      fetchShifts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving shift');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this shift?')) {
      await axios.delete(`/api/shifts/${id}`);
      fetchShifts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-600" />
          Shift Management
        </h2>
        <button 
          onClick={() => { setSelectedShift(null); setFormData({name:'Morning', startTime:'', endTime:'', duration:8}); setShowForm(true); }}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Add Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map(shift => (
          <div key={shift._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-blue-600">{shift.name}</h3>
            <div className="mt-4 space-y-2 text-slate-600 text-sm">
              <p>Time: <span className="font-semibold text-slate-900">{shift.startTime} - {shift.endTime}</span></p>
              <p>Duration: <span className="font-semibold text-slate-900">{shift.duration} hours</span></p>
            </div>
            <div className="mt-6 flex gap-2 border-t pt-4">
              <button onClick={() => { setSelectedShift(shift); setFormData(shift); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={16}/></button>
              <button onClick={() => handleDelete(shift._id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">{selectedShift ? 'Edit' : 'Add New'} Shift</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Shift Name</label>
                  <select name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100">
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="08:00 AM" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" required />
                  <input type="text" placeholder="04:00 PM" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" required />
                </div>
                <input type="number" placeholder="Duration (Hours)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" required />
                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100"><Check size={18}/> Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShiftManagement;
