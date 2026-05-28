import { useState, useEffect } from 'react';
import axios from 'axios';

const emptyMedicine = {
  medicineId: '',
  name: '',
  quantity: 1,
  instructions: '',
  price: 0,
};

export default function AddPrescription({ doctor }) {
  const [form, setForm] = useState({
    patientName: '',
    patientEmail: '',
    doctorName: doctor?.name || '',
    appointmentId: '',
    invoiceId: '',
    notes: '',
  });
  const [medicines, setMedicines] = useState([ { ...emptyMedicine } ]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [loadingMedicines, setLoadingMedicines] = useState(true);

  useEffect(() => {
    fetchAvailableMedicines();
  }, []);

  const fetchAvailableMedicines = async () => {
    try {
      const res = await axios.get('/api/pharmacy/stock');
      if (res.data.success) {
        setAvailableMedicines(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
    } finally {
      setLoadingMedicines(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicineChange = (index, event) => {
    const { name, value } = event.target;
    if (name === 'medicineId') {
      // When medicineId changes, also update name and price
      const selectedMedicine = availableMedicines.find(med => med._id === value);
      setMedicines((prev) => prev.map((item, idx) => idx === index ? {
        ...item,
        medicineId: value,
        name: selectedMedicine ? selectedMedicine.name : '',
        price: selectedMedicine ? selectedMedicine.price : 0,
      } : item));
    } else {
      setMedicines((prev) => prev.map((item, idx) => idx === index ? { ...item, [name]: name === 'quantity' || name === 'price' ? Number(value) : value } : item));
    }
  };

  const addLineItem = () => setMedicines((prev) => [ ...prev, { ...emptyMedicine } ]);
  const removeLineItem = (index) => setMedicines((prev) => prev.filter((item, idx) => idx !== index));

  const submitPrescription = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        ...form,
        medicines: medicines.filter((item) => item.medicineId && item.quantity > 0),
      };

      if (payload.medicines.length === 0) {
        setMessage({ type: 'error', text: 'At least one medicine is required.' });
        setSubmitting(false);
        return;
      }

      const response = await axios.post('/api/pharmacy/prescriptions', payload);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Prescription submitted successfully.' });
        setForm({ patientName: '', patientEmail: '', doctorName: doctor?.name || '', appointmentId: '', invoiceId: '', notes: '' });
        setMedicines([ { ...emptyMedicine } ]);
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to submit prescription.' });
      }
    } catch (error) {
      console.error('Submit prescription failed:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Server error while submitting prescription.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900">Submit Prescription</h1>
          <p className="mt-3 text-slate-500">Doctor can create a new prescription for the pharmacy to fulfill.</p>
        </div>

        {message && (
          <div className={`mb-6 rounded-3xl p-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
            {message.text}
          </div>
        )}

        <form className="space-y-8" onSubmit={submitPrescription}>
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span>Patient Name</span>
              <input
                name="patientName"
                value={form.patientName}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-600">
              <span>Patient Email</span>
              <input
                name="patientEmail"
                type="email"
                value={form.patientEmail}
                onChange={handleFormChange}
                className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-600 lg:col-span-2">
              <span>Doctor Name</span>
              <input
                name="doctorName"
                value={form.doctorName}
                onChange={handleFormChange}
                className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
                placeholder="Dr. John Doe"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-600">
              <span>Appointment ID</span>
              <input
                name="appointmentId"
                value={form.appointmentId}
                onChange={handleFormChange}
                className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-600">
              <span>Invoice ID</span>
              <input
                name="invoiceId"
                value={form.invoiceId}
                onChange={handleFormChange}
                className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
              />
            </label>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Medicines</h2>
                <p className="text-sm text-slate-500">Add medicines, quantity, price, and instructions.</p>
              </div>
              <button type="button" onClick={addLineItem} className="px-4 py-2 rounded-3xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
                Add Medicine
              </button>
            </div>

            <div className="space-y-4">
              {medicines.map((item, index) => (
                <div key={index} className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.8fr_1.1fr_0.6fr] items-end">
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Medicine</span>
                    <select
                      name="medicineId"
                      value={item.medicineId}
                      onChange={(event) => handleMedicineChange(index, event)}
                      required
                      disabled={loadingMedicines}
                      className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
                    >
                      <option value="">Select Medicine</option>
                      {availableMedicines.map((med) => (
                        <option key={med._id} value={med._id}>
                          {med.name} - ₹{med.price?.toFixed(2) || '0.00'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Qty</span>
                    <input
                      name="quantity"
                      type="number"
                      value={item.quantity}
                      min="1"
                      onChange={(event) => handleMedicineChange(index, event)}
                      required
                      className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Price</span>
                    <input
                      name="price"
                      type="number"
                      value={item.price}
                      min="0"
                      step="0.01"
                      onChange={(event) => handleMedicineChange(index, event)}
                      className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Instructions</span>
                    <input
                      name="instructions"
                      value={item.instructions}
                      onChange={(event) => handleMedicineChange(index, event)}
                      className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="h-12 w-full rounded-3xl bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label className="space-y-2 text-sm text-slate-600">
            <span>Doctor Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              rows="4"
              className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Prescription will be created in pending state and visible to pharmacy immediately.</p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? 'Submitting…' : 'Submit Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
