import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Droplet,
  Phone,
  Send,
  User,
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';

export default function PublicBloodBank() {
  const { isUserAuthenticated, userLoading } = useUserAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [requestForm, setRequestForm] = useState({
    bloodGroup: 'O+',
    units: 1,
    patientName: '',
    patientEmail: '',
    patientAge: '',
    department: '',
    urgency: 'High',
    description: '',
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get('/api/blood-bank/inventory');
        if (response.data.success) {
          setInventory(response.data.data.inventory);
        }
      } catch (err) {
        console.error('Error fetching blood availability');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleInputChange = (event) => {
    setRequestForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await axios.post('/api/blood-bank/emergency-request', requestForm);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Emergency request submitted. Our team will contact you shortly.' });
        setRequestForm({
          bloodGroup: 'O+',
          units: 1,
          patientName: '',
          patientEmail: '',
          patientAge: '',
          department: '',
          urgency: 'High',
          description: '',
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="surface-panel-strong p-8 sm:p-10 lg:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">Blood Bank Support</span>
          <h1 className="section-title mt-6">Live availability and emergency requests in one place.</h1>
          <p className="section-copy mt-5">
            Check current stock status and notify the blood bank team quickly when urgent patient needs require immediate coordination.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <div className="surface-panel-strong p-7 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
                <Droplet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Stock Status</h2>
                <p className="text-sm text-slate-500">Real-time availability across blood groups.</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {inventory.map((item) => (
                  <div
                    key={item.bloodGroup}
                    className="flex items-center justify-between rounded-[1.4rem] border border-slate-100 bg-slate-50/90 px-4 py-4"
                  >
                    <div>
                      <p className="text-lg font-extrabold text-slate-900">{item.bloodGroup}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {item.units} units
                      </p>
                    </div>
                    {item.units > 0 ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-extrabold uppercase text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-dark rounded-[2rem] p-7 sm:p-8">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-cyan-300" />
              <div>
                <h3 className="text-xl font-extrabold text-white">24/7 Helpline</h3>
                <p className="text-sm text-slate-300">Emergency coordination hotline</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-200">
              If blood is required immediately, call the emergency coordinator while submitting your request.
            </p>
            <p className="mt-4 text-2xl font-extrabold text-cyan-200">+1 (555) 999-0000</p>
          </div>
        </div>

        <div className="surface-panel-strong p-8 sm:p-10">
          {!isUserAuthenticated && !userLoading ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                <User className="h-10 w-10 text-amber-600" />
              </div>
              <span className="eyebrow">Login Required</span>
              <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Sign in before sending an emergency request.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                We use the patient account to connect the request with your contact details and follow-up communication.
              </p>
              <div className="mt-8 rounded-[1.8rem] border border-slate-200 bg-slate-50/80 px-6 py-5 text-sm font-semibold text-slate-600">
                Open Patient Login from the top navigation to continue.
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
                  <Clock className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">Emergency Blood Request</h2>
                  <p className="text-sm text-slate-500">Notify the blood bank team with the key patient details.</p>
                </div>
              </div>

              {message && (
                <div
                  className={`mb-6 rounded-[1.4rem] px-4 py-3 text-sm font-semibold ${
                    message.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                      : 'border border-rose-200 bg-rose-50 text-rose-600'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmitRequest} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Patient Name</label>
                    <div className="field-shell">
                      <input
                        type="text"
                        name="patientName"
                        required
                        value={requestForm.patientName}
                        onChange={handleInputChange}
                        placeholder="Enter patient name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Contact Email</label>
                    <div className="field-shell">
                      <input
                        type="email"
                        name="patientEmail"
                        required
                        value={requestForm.patientEmail}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Patient Age</label>
                    <div className="field-shell">
                      <input
                        type="number"
                        name="patientAge"
                        value={String(requestForm.patientAge)}
                        onChange={handleInputChange}
                        placeholder="e.g. 30"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Blood Group</label>
                      <div className="field-shell">
                        <select name="bloodGroup" value={requestForm.bloodGroup} onChange={handleInputChange}>
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bloodGroup) => (
                            <option key={bloodGroup} value={bloodGroup}>
                              {bloodGroup}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Units</label>
                      <div className="field-shell">
                        <input
                          type="number"
                          name="units"
                          min="1"
                          required
                          value={requestForm.units}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Department / Room</label>
                    <div className="field-shell">
                      <input
                        type="text"
                        name="department"
                        required
                        value={requestForm.department}
                        onChange={handleInputChange}
                        placeholder="ICU, Room 204"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Urgency Level</label>
                    <div className="field-shell">
                      <select name="urgency" value={requestForm.urgency} onChange={handleInputChange}>
                        <option value="Critical">Critical (Immediate)</option>
                        <option value="High">High (Within 2-4 hours)</option>
                        <option value="Medium">Medium (Routine)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Additional Details</label>
                  <div className="field-shell items-start">
                    <textarea
                      name="description"
                      value={requestForm.description}
                      onChange={handleInputChange}
                      placeholder="Mention any specific medical requirements..."
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="primary-button w-full justify-center py-4 text-base disabled:opacity-70">
                  {submitting ? 'Submitting...' : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Emergency Request
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
