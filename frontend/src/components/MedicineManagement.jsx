import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Search,
  PlusCircle,
  AlertTriangle,
  ClipboardList,
  Pill,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Filter,
} from 'lucide-react';
import axios from 'axios';
import { SOCKET_URL } from '../config/runtime';

axios.defaults.withCredentials = true;

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
});

const CATEGORY_OPTIONS = ['All', 'Tablet', 'Syrup', 'Injection', 'Ointment', 'Other'];

export default function MedicineManagement() {
  const [tab, setTab] = useState('inventory');
  const [stock, setStock] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Tablet',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    reorderLevel: 10,
    unit: 'Tabs',
    price: 0,
  });

  useEffect(() => {
    fetchStock();
    fetchPrescriptions();

    socket.on('new-prescription', (payload) => {
      setPrescriptions((current) => [payload, ...current]);
    });

    socket.on('prescription-updated', (payload) => {
      setPrescriptions((current) => current.map((item) => item._id === payload._id ? payload : item));
    });

    return () => {
      socket.off('new-prescription');
      socket.off('prescription-updated');
    };
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/pharmacy/stock');
      if (res.data.success) {
        setStock(res.data.data || []);
      }
    } catch (err) {
      console.error('Medicine stock fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get('/api/pharmacy/prescriptions');
      if (res.data.success) {
        setPrescriptions(res.data.data || []);
      }
    } catch (err) {
      console.error('Prescription fetch failed:', err);
    }
  };

  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
        || item.manufacturer?.toLowerCase().includes(search.toLowerCase())
        || item.batchNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [stock, search, category]);

  const expiringSoon = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 30);
    return stock.filter((item) => item.expiryDate && new Date(item.expiryDate) <= cutoff);
  }, [stock]);

  const lowStock = useMemo(() => stock.filter((item) => item.quantity <= item.reorderLevel), [stock]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addMedicine = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        reorderLevel: Number(form.reorderLevel),
        price: Number(form.price),
      };
      const res = await axios.post('/api/pharmacy/stock', payload);
      if (res.data.success) {
        setStock((current) => [res.data.data, ...current]);
        setForm({
          name: '',
          category: 'Tablet',
          manufacturer: '',
          batchNumber: '',
          expiryDate: '',
          quantity: 0,
          reorderLevel: 10,
          unit: 'Tabs',
          price: 0,
        });
        alert('Medicine added to stock successfully');
      }
    } catch (err) {
      console.error('Add medicine failed:', err);
      alert('Unable to add medicine. Please check the form and try again.');
    }
  };

  const handleDispatchPrescription = async (prescription) => {
    if (!window.confirm(`Dispatch prescription for ${prescription.patientName}?`)) return;
    try {
      const res = await axios.post(`/api/pharmacy/prescriptions/${prescription._id}/dispatch`, {
        appointmentId: prescription.appointmentId,
        invoiceId: prescription.invoiceId,
      });
      if (res.data.success) {
        setPrescriptions((current) => current.map((item) => item._id === prescription._id ? res.data.data : item));
        fetchStock();
        alert('Prescription dispatched successfully. Stock and billing updated.');
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      alert(err.response?.data?.error || 'Failed to dispatch medicine.');
    }
  };

  const renderStockTable = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-slate-900 font-bold text-lg mb-4">Stock Summary</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Total medicines</span>
              <strong>{stock.length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Low stock alerts</span>
              <strong>{lowStock.length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Expiring within 30 days</span>
              <strong>{expiringSoon.length}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-slate-900 font-bold text-lg mb-4">Filters</h3>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
                placeholder="Search medicine, manufacturer, batch..."
              />
            </div>
            <div>
              <label className="block text-slate-500 text-sm mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-slate-900 font-bold text-lg mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStock.length > 0 ? (
              lowStock.slice(0, 4).map((item) => (
                <div key={item._id} className="rounded-3xl p-4 bg-amber-50 border border-amber-100">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-slate-500 text-sm">Remaining: {item.quantity} {item.unit}</p>
                  <p className="text-rose-600 text-sm">Reorder level: {item.reorderLevel}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No medicines currently below reorder level.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Medicine</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Manufacturer</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Batch / Expiry</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-20 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : filteredStock.length > 0 ? (
              filteredStock.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-5 text-slate-500">{item.category}</td>
                  <td className="p-5 text-slate-500">{item.manufacturer || '—'}</td>
                  <td className="p-5 text-slate-500">{item.batchNumber || '—'} · {new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="p-5 text-slate-900 font-bold">{item.quantity} {item.unit}</td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Out of Stock' ? 'bg-rose-50 text-rose-600' :
                      item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-current" />
                      {item.status}
                    </span>
                  </td>
                  <td className="p-5 text-slate-700">₹{item.price.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-20 text-center text-slate-500">No medicines found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExpiryTracker = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
        <div>
          <h3 className="text-slate-900 text-2xl font-bold">Expiry Tracker</h3>
          <p className="text-slate-500">Medicines expiring in the next 30 days.</p>
        </div>
        <div className="rounded-3xl p-4 bg-rose-50 border border-rose-100 text-rose-700 max-w-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5" /> Expiry Alert
          </div>
          <p className="text-sm mt-2">Review these items and move expiring stock before it becomes unusable.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Medicine</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Batch</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Expiry Date</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Days Left</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {expiringSoon.length > 0 ? (
                expiringSoon.map((item) => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)));
                  return (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-5 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-5 text-slate-500">{item.batchNumber || '—'}</td>
                      <td className="p-5 text-slate-500">{new Date(item.expiryDate).toLocaleDateString()}</td>
                      <td className={`p-5 font-bold ${daysLeft <= 7 ? 'text-rose-600' : 'text-amber-600'}`}>{daysLeft} days</td>
                      <td className="p-5 text-slate-700">{item.quantity}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-slate-500">No expiring medicines in the next 30 days.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPrescriptionBoard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
        <div>
          <h3 className="text-slate-900 text-2xl font-bold">Prescription Requests</h3>
          <p className="text-slate-500">Real-time pharmacy sync for pending requests.</p>
        </div>
        <div className="rounded-3xl p-4 bg-blue-50 border border-blue-100 text-blue-700 max-w-sm">
          <div className="flex items-center gap-2 font-semibold">
            <CalendarCheck className="w-5 h-5" /> Real-time updates
          </div>
          <p className="text-sm mt-2">Doctors can prescribe medicines and the pharmacy sees the request instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Medicines</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.length > 0 ? (
                  prescriptions.map((prescription) => (
                    <tr key={prescription._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                        <div className="font-semibold text-slate-900">{prescription.patientName}</div>
                        <div className="text-slate-500 text-sm">{prescription.doctorName || 'Doctor'}</div>
                      </td>
                      <td className="p-5 text-slate-600">
                        {prescription.medicines.map((item) => (
                          <div key={item.name} className="mb-2">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-slate-400 text-xs">Qty: {item.quantity} | {item.instructions || 'No notes'}</div>
                          </div>
                        ))}
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          prescription.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700' :
                          prescription.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {prescription.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        {prescription.status === 'pending' ? (
                          <button
                            onClick={() => handleDispatchPrescription(prescription)}
                            className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Dispatch
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-20 text-center text-slate-500">No pending prescriptions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div>
              <h4 className="text-slate-900 font-semibold">Pharmacy Alerts</h4>
              <p className="text-slate-500 text-sm">Pending requests arrive instantly when doctors save prescriptions.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl p-4 bg-emerald-50 border border-emerald-100 text-emerald-700">
              <p className="text-sm">Prescriptions are auto-pushed to this board as soon as doctors submit them.</p>
            </div>
            <div className="rounded-3xl p-4 bg-slate-50 border border-slate-100">
              <p className="text-sm text-slate-600">Dispatching a prescription updates stock levels and can add pharmacy charges to the patient invoice automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddMedicineForm = () => (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <PlusCircle className="w-6 h-6 text-blue-600" />
        <h3 className="text-slate-900 text-2xl font-bold">Add New Medicine</h3>
      </div>
      <form className="grid grid-cols-1 lg:grid-cols-2 gap-5" onSubmit={addMedicine}>
        <label className="space-y-2 text-sm text-slate-600">
          <span>Name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleFormChange}
            required
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Category</span>
          <select
            name="category"
            value={form.category}
            onChange={handleFormChange}
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          >
            {CATEGORY_OPTIONS.filter((item) => item !== 'All').map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Manufacturer</span>
          <input
            name="manufacturer"
            value={form.manufacturer}
            onChange={handleFormChange}
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Batch Number</span>
          <input
            name="batchNumber"
            value={form.batchNumber}
            onChange={handleFormChange}
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Expiry Date</span>
          <input
            name="expiryDate"
            type="date"
            value={form.expiryDate}
            onChange={handleFormChange}
            required
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Quantity</span>
          <input
            name="quantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={handleFormChange}
            required
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Reorder Level</span>
          <input
            name="reorderLevel"
            type="number"
            min="0"
            value={form.reorderLevel}
            onChange={handleFormChange}
            required
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Unit</span>
          <input
            name="unit"
            value={form.unit}
            onChange={handleFormChange}
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600">
          <span>Price per unit</span>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleFormChange}
            required
            className="w-full px-4 py-3 rounded-3xl border border-slate-200 focus:border-blue-400 focus:ring-blue-100 outline-none"
          />
        </label>

        <div className="lg:col-span-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-3xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Add Medicine
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Medicine Stock Management</h2>
          <p className="text-slate-500">Track batches, expiry, low-stock warnings and pharmacy prescription requests.</p>
        </div>
        <div className="flex items-center gap-2 rounded-3xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
          <ClipboardList className="w-5 h-5 text-slate-500" />
          <span className="text-sm text-slate-600">Live medicine stock and prescription sync</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {['inventory', 'expiry', 'prescriptions'].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-3xl py-4 px-5 text-sm font-semibold transition-all ${tab === item ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200'}`}
          >
            {item === 'inventory' ? 'Inventory' : item === 'expiry' ? 'Expiry Tracker' : 'Prescriptions'}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {tab === 'inventory' && renderStockTable()}
        {tab === 'expiry' && renderExpiryTracker()}
        {tab === 'prescriptions' && renderPrescriptionBoard()}
        {renderAddMedicineForm()}
      </div>
    </div>
  );
}
