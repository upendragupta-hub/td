import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, 
  Search, 
  CalendarPlus, 
  History, 
  UserCircle, 
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Save,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  Phone,
  Receipt,
  CreditCard,
  Download,
  Ambulance,
  Copy,
  ExternalLink,
  MapPin,
  Route,
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import AppointmentForm from './AppointmentForm';
import { ensureRazorpayLoaded, getRazorpayKeyId } from '../utils/razorpay';
import { SOCKET_URL } from '../config/runtime';

// Global axios configuration to send cookies with every request
axios.defaults.withCredentials = true;

const ambulanceRequestStatusClasses = {
  Pending: 'bg-amber-100 text-amber-700',
  Assigned: 'bg-sky-100 text-sky-700',
  'Picked up': 'bg-violet-100 text-violet-700',
  Dropped: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const getAmbulanceMapQuery = (request) => {
  const liveLocation = request?.assignedAmbulance?.location;
  const fallbackLocation = request?.pickupLocation || request?.destination;
  const target = liveLocation?.lat != null && liveLocation?.lng != null
    ? liveLocation
    : fallbackLocation;

  if (!target) return '';
  if (target.lat != null && target.lng != null) {
    return `${target.lat},${target.lng}`;
  }

  return target.address || target.name || '';
};

const UserDashboard = () => {
  const { user, userLogout, refreshUserProfile } = useUserAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [ambulanceRequests, setAmbulanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const ambulanceSocketRef = useRef(null);

  // Profile & Password States
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ username: '', email: '', phone: '' });
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const buildPaymentNotificationMessage = (notifications) => {
    if (!notifications) {
      return 'Payment Successful! Receipt is ready in My Payments.';
    }

    const deliveredChannels = [];
    const failedChannels = [];

    if (notifications?.email?.sent) deliveredChannels.push('email');
    if (notifications?.whatsapp?.sent) deliveredChannels.push('WhatsApp');
    if (notifications?.email && !notifications.email.sent) {
      failedChannels.push(`email: ${notifications.email.reason || 'delivery failed'}`);
    }
    if (notifications?.whatsapp && !notifications.whatsapp.sent) {
      failedChannels.push(`WhatsApp: ${notifications.whatsapp.reason || 'delivery failed'}`);
    }

    if (deliveredChannels.length > 0) {
      return failedChannels.length > 0
        ? `Payment Successful! Receipt link sent via ${deliveredChannels.join(' and ')}. ${failedChannels.join(' | ')}.`
        : `Payment Successful! Receipt link sent via ${deliveredChannels.join(' and ')}.`;
    }

    return failedChannels.length > 0
      ? `Payment Successful, but auto notification was not sent. ${failedChannels.join(' | ')}. Receipt is ready in My Payments.`
      : 'Payment Successful! Receipt is ready in My Payments.';
  };

  const maybeOpenWhatsappFallback = (notifications, message) => {
    const whatsappFallbackLink = notifications?.whatsapp?.link;

    if (!whatsappFallbackLink || notifications?.whatsapp?.sent) {
      alert(message);
      return;
    }

    const shouldOpen = window.confirm(`${message}\n\nOpen WhatsApp now with the receipt link?`);
    if (shouldOpen) {
      window.open(whatsappFallbackLink, '_blank', 'noopener,noreferrer');
    }
  };

  const upsertAmbulanceRequest = useCallback((nextRequest) => {
    if (!nextRequest?._id) return;

    setAmbulanceRequests((currentRequests) => {
      const remainingRequests = currentRequests.filter((request) => request._id !== nextRequest._id);
      return [nextRequest, ...remainingRequests].sort(
        (left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0),
      );
    });
  }, []);

  const fetchMyAmbulanceRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await axios.get('/api/ambulance/my-requests');
      if (data.success) {
        setAmbulanceRequests(data.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching patient ambulance requests', error);
    }
  }, [user]);

  // Fetch Invoices function defined outside useEffect to reuse it after payment
  const fetchInvoices = async () => {
    try {
      const { data } = await axios.get('/api/billing/my-invoices');
      if (data.success) setInvoices(data.data);
    } catch (error) {
      console.error("Error fetching invoices", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, docRes] = await Promise.all([
          axios.get('/api/appointments/my-appointments'),
          axios.get('/api/doctors'),
          fetchInvoices(),
          fetchMyAmbulanceRequests(),
        ]);

        setAppointments(appRes.data.data || []);
        if (docRes.data.success) {
          setDoctors(docRes.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      setProfileFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      fetchData();
    }
  }, [fetchMyAmbulanceRequests, user]);

  useEffect(() => {
    if (!user) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    ambulanceSocketRef.current = socket;

    socket.on('ambulance:dashboard-refresh', () => {
      fetchMyAmbulanceRequests();
    });

    socket.on('ambulance:tracking-updated', ({ request }) => {
      upsertAmbulanceRequest(request);
    });

    return () => {
      socket.off('ambulance:dashboard-refresh');
      socket.off('ambulance:tracking-updated');
      socket.disconnect();
      ambulanceSocketRef.current = null;
    };
  }, [fetchMyAmbulanceRequests, upsertAmbulanceRequest, user]);

  useEffect(() => {
    const socket = ambulanceSocketRef.current;
    if (!socket) return;

    ambulanceRequests
      .filter((request) => !['Completed', 'Cancelled'].includes(request.requestStatus))
      .forEach((request) => {
        if (request.trackingCode) {
          socket.emit('join-tracking-room', { trackingCode: request.trackingCode });
        }
      });
  }, [ambulanceRequests]);

  const activeAmbulanceRequest = useMemo(
    () => ambulanceRequests.find((request) => !['Completed', 'Cancelled'].includes(request.requestStatus))
      || ambulanceRequests[0]
      || null,
    [ambulanceRequests],
  );

  const ambulanceMapQuery = useMemo(
    () => getAmbulanceMapQuery(activeAmbulanceRequest),
    [activeAmbulanceRequest],
  );

  const handlePayment = async (invoice) => {
    try {
      const { data } = await axios.post(`/api/billing/${invoice._id}/create-order`);
      const { order } = data;
      const key = await getRazorpayKeyId();

      ensureRazorpayLoaded();

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "WeCare Hospital",
        description: `Payment for Invoice ${invoice.invoiceId}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/api/billing/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoice._id
            });

            if (verifyRes.data.success) {
              const notificationMessage = buildPaymentNotificationMessage(verifyRes.data.notifications);
              maybeOpenWhatsappFallback(verifyRes.data.notifications, notificationMessage);
              fetchInvoices();
            }
          } catch (err) {
            alert('Verification Failed');
          }
        },
        theme: { color: "#3B82F6" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Could not initiate payment', error);
      alert('Could not initiate payment');
    }
  };

  const handleDownloadReceipt = async (invoiceId) => {
    try {
      const response = await axios.get(`/api/billing/${invoiceId}/receipt`, {
        responseType: 'blob', // Important: responseType must be 'blob' for file downloads
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${invoiceId}.pdf`); // Set the filename
      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up the DOM
      window.URL.revokeObjectURL(url); // Release the object URL

      alert('Receipt downloaded successfully!');
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert('Failed to download receipt.');
    }
  };

  const openAmbulanceTracking = (request) => {
    if (!request?.trackingCode) return;
    window.location.hash = `ambulance?tracking=${request.trackingCode}`;
  };

  const copyAmbulanceTrackingLink = async (request) => {
    if (!request?.trackingLink) return;

    try {
      await navigator.clipboard.writeText(request.trackingLink);
      alert('Ambulance tracking link copied.');
    } catch (error) {
      console.error('Unable to copy ambulance tracking link', error);
      alert('Tracking link copy nahi ho paya.');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discovery', label: 'Find Doctors', icon: Search },
    { id: 'booking', label: 'Book Now', icon: CalendarPlus },
    { id: 'history', label: 'My Appointments', icon: History },
    { id: 'ambulance', label: 'Ambulance', icon: Ambulance },
    { id: 'billing', label: 'My Payments', icon: Receipt },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  const activeMenu = menuItems.find((item) => item.id === activeTab);

  const renderOverview = () => {
    const pending = appointments.filter(a => a.status === 'pending').length;
    const nextAppt = appointments.find(a => new Date(a.date) > new Date());

    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-slate-800">Welcome back, {user?.username}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-200">
            <Clock className="mb-4 opacity-80" />
            <p className="text-sm opacity-90">Total Appointments</p>
            <h3 className="text-4xl font-bold">{appointments.length}</h3>
          </div>
          <div className="p-6 bg-orange-500 text-white rounded-3xl shadow-lg shadow-orange-200">
            <AlertCircle className="mb-4 opacity-80" />
            <p className="text-sm opacity-90">Pending Status</p>
            <h3 className="text-4xl font-bold">{pending}</h3>
          </div>
          <div className="p-6 bg-emerald-500 text-white rounded-3xl shadow-lg shadow-emerald-200">
            <CheckCircle2 className="mb-4 opacity-80" />
            <p className="text-sm opacity-90">Next Visit</p>
            <h3 className="text-xl font-bold">{nextAppt ? new Date(nextAppt.date).toLocaleDateString() : 'None Scheduled'}</h3>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('booking')}
          className="w-full py-6 bg-white border-2 border-dashed border-blue-200 rounded-3xl text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-3"
        >
          <CalendarPlus /> Book New Appointment
        </button>

        {activeAmbulanceRequest && (
          <div className="rounded-[2rem] bg-slate-900 px-6 py-6 text-white shadow-xl shadow-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Live Ambulance Tracking</p>
                <h3 className="mt-3 text-2xl font-bold">
                  {activeAmbulanceRequest.requestStatus} / {activeAmbulanceRequest.trackingCode}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  ETA {activeAmbulanceRequest.etaMinutes ? `${activeAmbulanceRequest.etaMinutes} min` : 'updating'}
                  {' / '}
                  Distance {activeAmbulanceRequest.patientDistanceKm ? `${activeAmbulanceRequest.patientDistanceKm} km` : 'calculating'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ambulance')}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100"
              >
                Open Ambulance Tracking
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDiscovery = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Find an Expert</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.length > 0 ? doctors.map((doc, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -5 }} 
            onClick={() => setActiveTab('booking')}
            className="cursor-pointer bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm"
          >
            <img src={doc.image} alt={doc.name} className="w-20 h-20 rounded-2xl mb-4 bg-slate-50" />
            <h4 className="font-bold text-lg">{doc.name}</h4>
            <p className="text-blue-600 text-sm font-semibold">{doc.specialty}</p>
            <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
              <span>Exp: {doc.experience}</span>
              <span className="font-bold text-slate-900">$50 Fees</span>
            </div>
            <button 
               onClick={() => setActiveTab('booking')}
               className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
            >
              Book Now
            </button>
          </motion.div>
        )) : (
          <div className="col-span-full p-10 text-center text-slate-400">Search for doctors feature coming soon.</div>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold">My Appointments</h2>
       <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
         <table className="w-full text-left">
           <thead className="bg-slate-50 border-b border-slate-100">
             <tr>
               <th className="px-6 py-4 font-bold text-sm text-slate-600">Doctor/Dept</th>
               <th className="px-6 py-4 font-bold text-sm text-slate-600">Date</th>
               <th className="px-6 py-4 font-bold text-sm text-slate-600">Status</th>
               <th className="px-6 py-4 font-bold text-sm text-slate-600">Action</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {appointments.map((appt, i) => (
               <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                 <td className="px-6 py-4 font-medium">{appt.department}</td>
                 <td className="px-6 py-4">{new Date(appt.date).toLocaleDateString()}</td>
                 <td className="px-6 py-4">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                     appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 
                     appt.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
                   }`}>
                     {appt.status}
                   </span>
                 </td>
                 <td className="px-6 py-4">
                    <button className="text-xs font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest">Cancel</button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
         {appointments.length === 0 && (
           <div className="p-20 text-center text-slate-400">No appointments found.</div>
         )}
       </div>
    </div>
  );

  const renderAmbulance = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ambulance Tracking</h2>
          <p className="mt-2 text-sm text-slate-500">
            Agar aapke naam ya phone number par ambulance booking bani hai, uski live tracking yahin automatically aa jayegi.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMyAmbulanceRequests}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <Ambulance size={16} />
          Refresh Tracking
        </button>
      </div>

      {activeAmbulanceRequest ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Tracking Code</p>
                  <h3 className="mt-3 text-3xl font-bold text-slate-900">{activeAmbulanceRequest.trackingCode}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Pickup for {activeAmbulanceRequest.patientName || user?.username || 'patient'} is being tracked live.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openAmbulanceTracking(activeAmbulanceRequest)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    <ExternalLink size={16} />
                    Full Tracking Page
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAmbulanceTrackingLink(activeAmbulanceRequest)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={16} />
                    Copy Link
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-sky-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Current Status</p>
                  <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${ambulanceRequestStatusClasses[activeAmbulanceRequest.requestStatus] || 'bg-slate-100 text-slate-700'}`}>
                    {activeAmbulanceRequest.requestStatus}
                  </span>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">ETA</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {activeAmbulanceRequest.etaMinutes ? `${activeAmbulanceRequest.etaMinutes} min` : '--'}
                  </p>
                </div>
                <div className="rounded-3xl bg-amber-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Distance</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {activeAmbulanceRequest.patientDistanceKm ? `${activeAmbulanceRequest.patientDistanceKm} km` : '--'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 text-cyan-700" size={18} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Pickup</p>
                      <p className="mt-2 font-semibold text-slate-900">{activeAmbulanceRequest.pickupLocation?.address}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-start gap-3">
                    <Route className="mt-1 text-cyan-700" size={18} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Destination</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {activeAmbulanceRequest.destination?.name || activeAmbulanceRequest.destination?.address}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{activeAmbulanceRequest.destination?.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Assigned Ambulance</h3>
                {activeAmbulanceRequest.assignedAmbulance ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Vehicle</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{activeAmbulanceRequest.assignedAmbulance.vehicleNumber}</p>
                      <p className="mt-2 text-sm text-slate-500">{activeAmbulanceRequest.assignedAmbulance.type}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Driver Contact</p>
                      <p className="mt-2 font-semibold text-slate-900">{activeAmbulanceRequest.assignedDriver || activeAmbulanceRequest.assignedAmbulance.driverName}</p>
                      <p className="mt-1 text-sm text-slate-500">{activeAmbulanceRequest.assignedAmbulance.contact}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Latest Location</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {activeAmbulanceRequest.assignedAmbulance.location?.address || 'Live GPS update aa raha hai'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    Booking mil gayi hai. Jaise hi ambulance assign hogi, vehicle aur driver details yahin aa jayengi.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-sm">
                {ambulanceMapQuery ? (
                  <iframe
                    title="Patient ambulance live map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(ambulanceMapQuery)}&z=13&output=embed`}
                    className="h-72 w-full rounded-[1.5rem] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-[1.5rem] bg-slate-50 text-sm text-slate-500">
                    Live map location waiting for first GPS update.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Recent Ambulance Bookings</h3>
            <div className="mt-5 space-y-4">
              {ambulanceRequests.map((request) => (
                <div key={request._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{request.trackingCode}</p>
                      <p className="mt-1 text-sm text-slate-500">{request.pickupLocation?.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${ambulanceRequestStatusClasses[request.requestStatus] || 'bg-slate-100 text-slate-700'}`}>
                        {request.requestStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => openAmbulanceTracking(request)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <ExternalLink size={14} />
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 px-8 py-16 text-center shadow-sm">
          <Ambulance className="mx-auto h-12 w-12 text-cyan-700" />
          <h3 className="mt-5 text-2xl font-bold text-slate-900">Abhi koi ambulance booking linked nahi mili</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Jab ambulance booking create hogi aur patient ka mobile number aapke account se match karega, live tracking is tab me automatically dikh jayegi.
          </p>
        </div>
      )}
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Invoices & Payments</h2>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold text-sm text-slate-600">Invoice ID</th>
              <th className="px-6 py-4 font-bold text-sm text-slate-600">Amount</th>
              <th className="px-6 py-4 font-bold text-sm text-slate-600">Status</th>
              <th className="px-6 py-4 font-bold text-sm text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.length > 0 ? invoices.map((inv) => (
              <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium">{inv.invoiceId}</td>
                <td className="px-6 py-4 font-bold text-slate-900">₹{inv.totalAmount}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {inv.status === 'Unpaid' ? (
                    <button 
                      onClick={() => handlePayment(inv)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                    >
                      <CreditCard size={14} /> Pay Now
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDownloadReceipt(inv._id)}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                    >
                      <Download size={14} /> Download
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="p-10 text-center text-slate-400">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('/api/users/profile', profileFormData);
      if (res.data.success) {
        await refreshUserProfile();
        setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
        setProfileEditMode(false);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      return setStatusMsg({ type: 'error', text: 'New passwords do not match' });
    }
    try {
      const res = await axios.put('/api/users/password', {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      });
      if (res.data.success) {
        setStatusMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed' });
    }
  };

  const renderProfile = () => (
    <div className="max-w-3xl space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Account Settings</h2>
        {statusMsg.text && (
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {statusMsg.text}
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Personal Info</h4>
          <button 
            onClick={() => setProfileEditMode(!profileEditMode)}
            className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:underline"
          >
            {profileEditMode ? <><XCircle size={16}/> Cancel</> : <><Edit size={16}/> Edit Profile</>}
          </button>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
              <input 
                type="text" 
                readOnly={!profileEditMode}
                value={profileFormData.username}
                onChange={(e) => setProfileFormData({...profileFormData, username: e.target.value})}
                className={`w-full p-4 rounded-2xl border outline-none transition-all ${profileEditMode ? 'bg-white border-blue-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-transparent'}`} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <input 
                type="email" 
                readOnly={!profileEditMode}
                value={profileFormData.email}
                onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})}
                className={`w-full p-4 rounded-2xl border outline-none transition-all ${profileEditMode ? 'bg-white border-blue-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-transparent'}`} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">WhatsApp Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  readOnly={!profileEditMode}
                  value={profileFormData.phone}
                  onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})}
                  className={`w-full p-4 pl-11 rounded-2xl border outline-none transition-all ${profileEditMode ? 'bg-white border-blue-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-transparent'}`} 
                  placeholder="+919876543210"
                />
              </div>
            </div>
          </div>
          {profileEditMode && (
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200">
              <Save size={18} /> Save Profile Changes
            </button>
          )}
        </form>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white/10 rounded-lg"><KeyRound size={20} /></div>
          <h4 className="font-bold text-lg">Change Password</h4>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="relative">
            <input 
              type={showPasswords ? "text" : "password"} 
              placeholder="Current Password"
              value={passwordFormData.currentPassword}
              onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-colors"
            />
            <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
              {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type={showPasswords ? "text" : "password"} 
              placeholder="New Password"
              value={passwordFormData.newPassword}
              onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-colors"
            />
            <input 
              type={showPasswords ? "text" : "password"} 
              placeholder="Confirm New Password"
              value={passwordFormData.confirmPassword}
              onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="surface-panel-strong rounded-[2rem] px-8 py-16 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-700" />
        <p className="mt-5 font-bold text-cyan-700">Loading your patient portal...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <div className="sidebar-shell w-full p-4 xl:w-72">
        <div className="rounded-[1.8rem] bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 px-5 py-6 text-white shadow-lg shadow-cyan-500/20">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">Patient Portal</p>
          <h2 className="mt-3 text-2xl font-extrabold">{user?.username}</h2>
          <p className="mt-2 text-sm text-cyan-50/90">{user?.email}</p>
        </div>

        <div className="mt-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'text-slate-500 hover:bg-white/90'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <button
            onClick={userLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="surface-dark rounded-[2rem] px-6 py-7 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">{activeMenu?.label}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white">Everything for your next visit, in one place.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
            Track appointments, review billing, and keep your profile details up to date from your patient workspace.
          </p>
        </div>

        <div className="dashboard-panel min-h-[70vh] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'discovery' && renderDiscovery()}
              {activeTab === 'booking' && <AppointmentForm />}
              {activeTab === 'history' && renderHistory()}
              {activeTab === 'ambulance' && renderAmbulance()}
              {activeTab === 'billing' && renderBilling()}
              {activeTab === 'profile' && renderProfile()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
