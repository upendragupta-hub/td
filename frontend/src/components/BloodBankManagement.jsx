import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCcw, // For refreshing inventory
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  PlusCircle,
  ArrowRightCircle,
  ClipboardList, // New icon for requests
  User,
  Droplet, // New icon for blood,
  // XCircle is already imported, no need to import again.
} from 'lucide-react';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return ( // Added XCircle import for Modal
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}> 
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Main component for Blood Bank Management
export default function BloodBankManagement() {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('requests'); // 'inventory' or 'requests' - Changed to 'requests' by default
  const [requestsLoading, setRequestsLoading] = useState(true); // New state for requests loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [criticalUpdates, setCriticalUpdates] = useState({});
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationForm, setDonationForm] = useState({
    bloodGroup: 'O+',
    units: '',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
  });
  const [issueForm, setIssueForm] = useState({
    bloodGroup: 'O+',
    units: '',
    patientId: '',
    patientName: '', // Added patientName for clarity in backend
    department: 'General',
  });

  const fetchInventory = async () => {
    console.log("BloodBankManagement: Fetching inventory...");
    setLoading(true);
    setRequestsLoading(true); // Start loading for requests
    setError('');
    try {
      const response = await axios.get('/api/blood-bank/inventory');
      if (response.data.success) {
        setInventory(response.data.data.inventory || []);
        setStats(response.data.data.stats || null);
        console.log("BloodBankManagement: Inventory fetched successfully.");
      } else {
        setError(response.data.error || 'Could not load blood inventory');
        console.error("BloodBankManagement: API error", response.data.error);
      }
      
      const reqRes = await axios.get('/api/blood-bank/emergency-requests');
      if (reqRes.data.success) {
        setRequests(reqRes.data.data);
        console.log("BloodBankManagement: Emergency requests fetched:", reqRes.data.data);
      } else {
        setError(reqRes.data.error || 'Failed to load emergency requests');
        console.error("BloodBankManagement: API error fetching emergency requests", reqRes.data.error);
      }

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load blood inventory');
      console.error("BloodBankManagement: Network error", err);
    } finally {
      setLoading(false);
      console.log("BloodBankManagement: Loading state set to false.");
      setRequestsLoading(false); // End loading for requests
    }
  };

  const handleRequestStatus = async (id, status) => {
    setError('');
    setSuccess('');
    try {
      setIsSubmitting(true);
      const res = await axios.patch(`/api/blood-bank/emergency-requests/${id}/status`, { status });
      if (res.data.success) {
        setSuccess(`Request marked as ${status}. Notification sent.`);
        // Refresh both requests and inventory
        fetchInventory();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update request status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateCritical = async (bloodGroup) => {
    const updatedValue = parseInt(criticalUpdates[bloodGroup], 10);
    if (Number.isNaN(updatedValue) || updatedValue < 0) {
      setError('Critical level must be a non-negative number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.patch(`/api/blood-bank/critical-level/${encodeURIComponent(bloodGroup)}`, {
        criticalLevel: updatedValue,
      });
      if (response.data.success) {
        setSuccess(`Critical level for ${bloodGroup} updated to ${updatedValue}`);
        fetchInventory();
      } else {
        setError(response.data.error || 'Failed to update critical level');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update critical level');
    } finally {
      setLoading(false);
    }
  };

  const handleDonationChange = (e) => {
    const { name, value } = e.target;
    setDonationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIssueChange = (e) => {
    const { name, value } = e.target;
    setIssueForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitDonation = async (e) => {
    e.preventDefault();
    if (!donationForm.bloodGroup || !donationForm.units || Number(donationForm.units) <= 0) {
      setError('Please enter a valid blood group and donation units.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/blood-bank/donate', {
        bloodGroup: donationForm.bloodGroup,
        units: Number(donationForm.units),
        donorName: donationForm.donorName,
        donorEmail: donationForm.donorEmail,
        donorPhone: donationForm.donorPhone,
      });
      if (response.data.success) {
        setSuccess(response.data.message || 'Donation added successfully.');
        setIsDonationModalOpen(false);
        setDonationForm({ bloodGroup: 'O+', units: '', donorName: '', donorEmail: '', donorPhone: '' });
        fetchInventory();
      } else {
        setError(response.data.error || 'Failed to add donation');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.bloodGroup || !issueForm.units || Number(issueForm.units) <= 0 || !issueForm.patientId) {
      setError('Please enter a blood group, patient ID, and required units.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/blood-bank/use', {
        bloodGroup: issueForm.bloodGroup,
        units: Number(issueForm.units),
        patientName: issueForm.patientName || issueForm.patientId, // Backend expects patientName
        department: issueForm.department || 'Emergency',
      });
      if (response.data.success) {
        setSuccess(response.data.message || 'Blood issued successfully.');
        setIsIssueModalOpen(false);
        setIssueForm({ 
          bloodGroup: 'O+', 
          units: '', 
          patientId: '', 
          patientName: '', 
          department: 'General' 
        });
        fetchInventory();
      } else {
        setError(response.data.error || 'Failed to issue blood');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to issue blood');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (units, criticalLevel) => {
    const isCritical = units <= criticalLevel;
    if (isCritical) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 ring-1 ring-rose-300 animate-pulse">
          <AlertTriangle className="w-3 h-3" /> Critical Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5" /> Normal
      </span>
    );
  };

  // Function to handle critical level input changes
  const handleCriticalLevelChange = (bloodGroup, value) => {
    setCriticalUpdates((prev) => ({
      ...prev,
      [bloodGroup]: value,
    }));
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Blood Bank Management</h2>
          <p className="text-sm text-slate-500 mt-2">Inventory, critical alerts, and donation / issuance actions for all blood groups.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
          <button 
            onClick={() => setActiveSubTab('inventory')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActiveSubTab('requests')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Blood Requests ({requests.filter(r => r.status === 'Pending').length})
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDonationModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-emerald-700 transition"
          >
            <PlusCircle className="w-4 h-4" /> Add Donation
          </button>
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-slate-800 transition"
          >
            <ArrowRightCircle className="w-4 h-4" /> Issue Blood
          </button>
          <button
            onClick={fetchInventory}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-blue-700 transition"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh Inventory
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{error}</div>
      )}

      {success && (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-blue-600">
            <HeartPulse className="w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Total Blood Units</h3>
          </div>
          <p className="mt-4 text-4xl font-bold text-slate-900">{stats?.totalUnits ?? '--'}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Critical Blood Groups</h3>
          </div>
          <p className="mt-4 text-4xl font-bold text-slate-900">{stats?.criticalGroups?.length ?? '--'}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Normal Blood Groups</h3>
          </div>
          <p className="mt-4 text-4xl font-bold text-slate-900">
            {stats?.fullInventory ? stats.fullInventory.length - (stats.criticalGroups?.length ?? 0) : '--'}
          </p>
        </div>
      </div>

      {activeSubTab === 'inventory' ? (
      <>
      {/* Inventory Table */}
      <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4 flex items-center gap-2">
        <Droplet className="w-6 h-6 text-blue-600" /> Blood Inventory Overview
      </h3>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Blood Group</th>
              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Units</th>
              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Critical Level</th>
              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Set Critical</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-slate-400">Loading blood inventory...</td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-slate-400">No blood inventory available.</td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item._id} className={item.units <= item.criticalLevel ? 'bg-rose-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.bloodGroup}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-slate-700">{item.units} <span className="text-xs font-normal text-slate-400">units</span></td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(item.units, item.criticalLevel)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={criticalUpdates[item.bloodGroup] !== undefined ? criticalUpdates[item.bloodGroup] : item.criticalLevel}
                        onChange={(e) => handleCriticalLevelChange(item.bloodGroup, e.target.value)}
                        className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                      <button
                        onClick={() => handleUpdateCritical(item.bloodGroup)}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white text-xs font-semibold hover:bg-blue-700 transition"
                      >
                        <RefreshCcw className="w-3 h-3" /> Update Limit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-rose-500" /> Patient Emergency Requests
          </h3>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Patient / Requester</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Blood Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Urgency</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requestsLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400">Loading emergency requests...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">No requests found.</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{req.patientName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <User size={10}/> {req.requestedBy?.username || 'Anonymous'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-black text-rose-600">{req.bloodGroup}</span>
                        <span className="text-xs text-slate-400 ml-2">({req.units} units)</span>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{req.department}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                          req.urgency === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${
                          req.status === 'Approved' ? 'text-emerald-600' : 
                          req.status === 'Cancelled' ? 'text-slate-400' : 'text-amber-500'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'Pending' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleRequestStatus(req._id, 'Approved')} // Added onClick handler
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRequestStatus(req._id, 'Cancelled')} // Added onClick handler
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status === 'Approved' && (
                           <button // Added onClick handler
                            onClick={() => handleRequestStatus(req._id, 'Completed')}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Mark Done
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Action Center</h3>
        <p className="text-sm text-slate-500 mt-2">Use the buttons above to add donations or issue blood directly from the dashboard.</p>
      </div>

      <Modal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} title="Add Donation">
        <form onSubmit={submitDonation} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Blood Group</span>
              <select
                name="bloodGroup"
                value={donationForm.bloodGroup}
                onChange={handleDonationChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Units</span>
              <input
                name="units"
                type="number"
                min="1"
                value={donationForm.units}
                onChange={handleDonationChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Donor Name</span>
              <input
                name="donorName"
                type="text"
                value={donationForm.donorName}
                onChange={handleDonationChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Donor Email</span>
              <input
                name="donorEmail"
                type="email"
                value={donationForm.donorEmail}
                onChange={handleDonationChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Donor Phone</span>
            <input
              name="donorPhone"
              type="text"
              value={donationForm.donorPhone}
              onChange={handleDonationChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle className="w-4 h-4" /> Add Donation
          </button>
        </form>
      </Modal>

      <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Issue Blood">
        <form onSubmit={submitIssue} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Blood Group</span>
              <select
                name="bloodGroup"
                value={issueForm.bloodGroup}
                onChange={handleIssueChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 font-bold">Required Units</span>
              <input
                name="units"
                type="number"
                min="1"
                value={issueForm.units}
                onChange={handleIssueChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Patient ID / UHID</span>
              <input
                name="patientId"
                type="text"
                value={issueForm.patientId}
                onChange={handleIssueChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Department</span>
              <input
                name="department"
                type="text"
                value={issueForm.department}
                onChange={handleIssueChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Patient Name</span>
            <input
              name="patientName"
              type="text"
              value={issueForm.patientName}
              onChange={handleIssueChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowRightCircle className="w-4 h-4" /> Issue Blood
          </button>
        </form>
      </Modal>
    </div>
  );
}
