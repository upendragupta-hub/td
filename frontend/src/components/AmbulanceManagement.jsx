import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { SOCKET_URL } from '../config/runtime';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  BellRing,
  CheckCircle2,
  ClipboardPlus,
  Clock3,
  Copy,
  Fuel,
  Gauge,
  Hospital,
  LocateFixed,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  RefreshCcw,
  Route,
  Send,
  ShieldAlert,
  TimerReset,
  UserRound,
  Wallet,
  Wrench,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const VEHICLE_TYPES = ['AC', 'Non-AC', 'ICU', 'Oxygen-supported'];
const AMBULANCE_STATUSES = ['Available', 'Busy', 'Maintenance'];
const URGENCY_LEVELS = ['Low', 'Moderate', 'Critical'];
const VIEW_OPTIONS = ['admin', 'driver', 'tracking', 'public'];

let googleMapsPromise;

const emptyAmbulanceForm = {
  vehicleNumber: '',
  type: 'AC',
  driverName: '',
  contact: '',
  currentStatus: 'Available',
  shiftStatus: 'Off Shift',
  locationAddress: '',
  locationLat: '28.6139',
  locationLng: '77.2090',
  oxygenCylinder: true,
  defibrillator: false,
  ventilator: false,
  stretcher: true,
  currentKm: '',
  serviceDueKm: '',
  pricingModel: 'distance',
  perKmRate: '45',
  flatRate: '1200',
  notes: '',
};

const emptyRequestForm = {
  patientId: '',
  patientName: '',
  patientPhone: '',
  pickupAddress: '',
  pickupLat: '28.6139',
  pickupLng: '77.2090',
  destinationName: 'WeCare Hospital',
  destinationAddress: '',
  destinationType: 'Hospital',
  destinationLat: '28.5921',
  destinationLng: '77.2290',
  urgencyLevel: 'Moderate',
  assignedDriver: '',
  pricingModel: 'distance',
};

const emptyTripLog = {
  distanceKm: '',
  fuelLitres: '',
  currentKm: '',
};

const emptyMaintenanceForm = {
  issueTitle: '',
  description: '',
  priority: 'Medium',
  currentKm: '',
  locationAddress: '',
};

const requestStatusClasses = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Assigned: 'bg-sky-50 text-sky-700 border-sky-200',
  'Picked up': 'bg-violet-50 text-violet-700 border-violet-200',
  Dropped: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const ambulanceStatusClasses = {
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Busy: 'bg-rose-50 text-rose-700 border-rose-200',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
};

const round = (value, decimals = 1) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
};

const formatDateTime = (value) => {
  if (!value) return 'Not logged yet';
  return new Date(value).toLocaleString();
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'TBD';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const buildDirectionsLink = (request, ambulance) => {
  const target = request?.requestStatus === 'Picked up' ? request.destination : request.pickupLocation;
  const destination = target?.lat && target?.lng
    ? `${target.lat},${target.lng}`
    : target?.address || '';
  const origin = ambulance?.location?.lat && ambulance?.location?.lng
    ? `&origin=${encodeURIComponent(`${ambulance.location.lat},${ambulance.location.lng}`)}`
    : '';

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${origin}`;
};

const loadGoogleMaps = (apiKey) => {
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `initWeCareMaps_${Date.now()}`;
    const existingScript = document.querySelector('script[data-wecare-google-maps]');

    window[callbackName] = () => {
      resolve(window.google);
      delete window[callbackName];
    };

    if (existingScript) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.dataset.wecareGoogleMaps = 'true';
    script.onerror = () => {
      reject(new Error('Unable to load Google Maps'));
      delete window[callbackName];
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-[1.8rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_38px_rgba(15,35,64,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ value, type = 'ambulance' }) {
  const styles = type === 'request' ? requestStatusClasses : ambulanceStatusClasses;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${styles[value] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

function FieldLabel({ children }) {
  return <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{children}</label>;
}

function SectionCard({ title, description, icon: Icon, children, rightAction }) {
  return (
    <div className="rounded-[2rem] border border-white/75 bg-white/92 p-6 shadow-[0_22px_50px_rgba(15,35,64,0.08)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
          </div>
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  );
}

function FleetMap({ ambulances, requests, focusedAmbulance }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !focusedAmbulance || !mapRef.current) return undefined;

    let isCancelled = false;
    let markers = [];

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        if (isCancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: {
            lat: focusedAmbulance.location?.lat || 28.6139,
            lng: focusedAmbulance.location?.lng || 77.209,
          },
          zoom: 11,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const bounds = new google.maps.LatLngBounds();

        ambulances.forEach((ambulance) => {
          if (ambulance.location?.lat == null || ambulance.location?.lng == null) return;

          const fillColor = ambulance.currentStatus === 'Available'
            ? '#16a34a'
            : ambulance.currentStatus === 'Busy'
              ? '#dc2626'
              : '#d97706';

          const marker = new google.maps.Marker({
            position: { lat: ambulance.location.lat, lng: ambulance.location.lng },
            map,
            title: `${ambulance.vehicleNumber} - ${ambulance.driverName}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor,
              fillOpacity: 1,
              scale: 9,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });

          markers.push(marker);
          bounds.extend(marker.getPosition());
        });

        requests
          .filter((request) => !['Completed', 'Cancelled'].includes(request.requestStatus))
          .forEach((request) => {
            const target = request.requestStatus === 'Picked up' ? request.destination : request.pickupLocation;
            if (target?.lat == null || target?.lng == null) return;

            const marker = new google.maps.Marker({
              position: { lat: target.lat, lng: target.lng },
              map,
              title: `${request.patientId} - ${request.requestStatus}`,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: '#2563eb',
                fillOpacity: 1,
                scale: 6,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });

            markers.push(marker);
            bounds.extend(marker.getPosition());
          });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 64);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
      markers.forEach((marker) => marker.setMap(null));
      markers = [];
    };
  }, [ambulances, focusedAmbulance, requests]);

  if (!focusedAmbulance) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Select an ambulance to load the live map.
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    const query = focusedAmbulance.location?.lat && focusedAmbulance.location?.lng
      ? `${focusedAmbulance.location.lat},${focusedAmbulance.location.lng}`
      : focusedAmbulance.location?.address || focusedAmbulance.vehicleNumber;

    return (
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50">
        <iframe
          title="Ambulance live map"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=12&output=embed`}
          className="h-[300px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="border-t border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
          Set `VITE_GOOGLE_MAPS_API_KEY` to unlock full multi-marker live maps. The fallback preview is centered on the selected ambulance.
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[360px] w-full overflow-hidden rounded-[2rem] border border-slate-200" />;
}

export default function AmbulanceManagement({ mode = 'admin' }) {
  const isPublicMode = mode === 'public';
  const [dashboard, setDashboard] = useState({
    ambulances: [],
    requests: [],
    stats: {
      totalAmbulances: 0,
      availableAmbulances: 0,
      busyAmbulances: 0,
      maintenanceAmbulances: 0,
      activeRequests: 0,
      criticalRequests: 0,
      maintenanceAlerts: 0,
      pendingMaintenanceReports: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState(isPublicMode ? 'public' : 'admin');
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingData, setTrackingData] = useState(null); // For public tracking view
  const [selectedDriverAmbulanceId, setSelectedDriverAmbulanceId] = useState('');
  const [focusedAmbulanceId, setFocusedAmbulanceId] = useState('');
  const [driverAlert, setDriverAlert] = useState(null);
  const [ambulanceForm, setAmbulanceForm] = useState(emptyAmbulanceForm);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [tripLog, setTripLog] = useState(emptyTripLog);
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenanceForm);
  const [message, setMessage] = useState({ type: 'info', text: '' });
  const [geoError, setGeoError] = useState('');
  const socketRef = useRef(null);

  const showMessage = useCallback((text, type = 'info') => {
    setMessage({ text, type });
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = window.setTimeout(() => setMessage({ type: 'info', text: '' }), 3600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const syncHashState = useCallback((nextView, nextTrackingCode = '') => {
    if (!isPublicMode) return;
    const params = new URLSearchParams();
    if (nextTrackingCode) params.set('tracking', nextTrackingCode);

    const query = params.toString();
    window.history.replaceState(null, '', `#ambulance${query ? `?${query}` : ''}`);
  }, [isPublicMode]);

  const readHashState = useCallback(() => {
    if (!isPublicMode) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash.startsWith('ambulance')) return;
    const [, rawQuery = ''] = hash.split('?');
    const params = new URLSearchParams(rawQuery);
    const nextTrackingCode = params.get('tracking') || '';

    if (nextTrackingCode) {
      setView('tracking');
      setTrackingCode(nextTrackingCode);
      return;
    }

    setTrackingCode('');
    setTrackingData(null);
    setView('public');
  }, [isPublicMode]);

  useEffect(() => {
    if (!isPublicMode) return undefined;
    readHashState();
    window.addEventListener('hashchange', readHashState);
    return () => window.removeEventListener('hashchange', readHashState);
  }, [isPublicMode, readHashState]);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get('/api/ambulance/dashboard');
      if (response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (error) {
      console.error('Ambulance dashboard fetch failed:', error);
      showMessage('Unable to load ambulance dashboard right now.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const fetchTracking = useCallback(async (code) => {
    if (!code) return;

    try {
      const response = await axios.get(`/api/ambulance/track/${code}`);
      if (response.data.success) {
        setTrackingData(response.data.data);
        setTrackingCode(code);
      }
    } catch (error) {
      console.error('Tracking fetch failed:', error);
      setTrackingData(null);
      showMessage('Tracking code not found. Please verify and try again.', 'error');
    }
  }, [showMessage]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (isPublicMode && view === 'tracking' && trackingCode) {
      fetchTracking(trackingCode);
    }
  }, [fetchTracking, isPublicMode, trackingCode, view]);

  useEffect(() => {
    if (!focusedAmbulanceId && dashboard.ambulances[0]) {
      setFocusedAmbulanceId(dashboard.ambulances[0]._id);
    }
    if (!selectedDriverAmbulanceId && dashboard.ambulances[0]) {
      setSelectedDriverAmbulanceId(dashboard.ambulances[0]._id);
    }
  }, [dashboard.ambulances, focusedAmbulanceId, selectedDriverAmbulanceId, mode]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('ambulance:dashboard-refresh', () => {
      fetchDashboard();
      if (trackingCode) {
        fetchTracking(trackingCode);
      }
    });

    socket.on('ambulance:assigned', ({ request }) => {
      setDriverAlert(request || null);
      fetchDashboard();
      if (request?.trackingCode && request.trackingCode === trackingCode) {
        setTrackingData(request);
      }
    });

    socket.on('ambulance:tracking-updated', ({ request }) => {
      if (request?.trackingCode === trackingCode) {
        setTrackingData(request);
      }
    });

    socket.on('ambulance:maintenance-reported', () => {
      fetchDashboard();
    });

    return () => {
      socket.off('ambulance:dashboard-refresh');
      socket.off('ambulance:assigned');
      socket.off('ambulance:tracking-updated');
      socket.off('ambulance:maintenance-reported');
      socket.disconnect();
    };
  }, [fetchDashboard, fetchTracking, trackingCode]);

  useEffect(() => {
    const socket = socketRef.current;
    const driver = dashboard.ambulances.find((item) => item._id === selectedDriverAmbulanceId);
    if (!socket || !driver) return;

    socket.emit('join-driver-room', {
      ambulanceId: driver._id,
      vehicleNumber: driver.vehicleNumber,
      contact: driver.contact,
    });
  }, [dashboard.ambulances, selectedDriverAmbulanceId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !trackingCode) return;
    socket.emit('join-tracking-room', { trackingCode });
  }, [trackingCode]);

  const focusedAmbulance = useMemo(
    () => dashboard.ambulances.find((item) => item._id === focusedAmbulanceId) || dashboard.ambulances[0] || null,
    [dashboard.ambulances, focusedAmbulanceId],
  );

  const selectedDriverAmbulance = useMemo(
    () => dashboard.ambulances.find((item) => item._id === selectedDriverAmbulanceId) || dashboard.ambulances[0] || null,
    [dashboard.ambulances, selectedDriverAmbulanceId],
  );

  useEffect(() => {
    if (!selectedDriverAmbulance) return;
    setMaintenanceForm({
      ...emptyMaintenanceForm,
      currentKm: String(selectedDriverAmbulance.maintenance?.currentKm || ''),
      locationAddress: selectedDriverAmbulance.location?.address || '',
    });
  }, [selectedDriverAmbulance]);

  const driverActiveRequest = useMemo(
    () => dashboard.requests.find(
      (request) => request.assignedAmbulance?._id === selectedDriverAmbulance?._id
        && !['Completed', 'Cancelled'].includes(request.requestStatus),
    ) || null,
    [dashboard.requests, selectedDriverAmbulance],
  );

  useEffect(() => {
    if (view !== 'driver' || !selectedDriverAmbulance || selectedDriverAmbulance.shiftStatus !== 'On Shift') {
      return undefined;
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not available in this browser.');
      return undefined;
    }

    let isCancelled = false;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (isCancelled) return;

          setGeoError('');

          try {
            await axios.patch(`/api/ambulance/fleet/${selectedDriverAmbulance._id}/location`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: selectedDriverAmbulance.location?.address || 'Live driver ping',
            }); // This is for updating the ambulance's own location in DB
          } catch (error) {
            console.error('Location update failed:', error);
          }
        },
        () => {
          if (!isCancelled) {
            setGeoError('Location permission denied. Live ETA will refresh when access is enabled.');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 12000,
        },
      );

    // Initial push and interval setup
    pushLocation();
    const intervalId = window.setInterval(pushLocation, 15000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedDriverAmbulance, view]);

  const handleAmbulanceField = (event) => {
    const { name, value, type, checked } = event.target;
    setAmbulanceForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRequestField = (event) => {
    const { name, value } = event.target;
    setRequestForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTripLogField = (event) => {
    const { name, value } = event.target;
    setTripLog((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleMaintenanceField = (event) => {
    const { name, value } = event.target;
    setMaintenanceForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitAmbulance = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/api/ambulance/fleet', {
        vehicleNumber: ambulanceForm.vehicleNumber,
        type: ambulanceForm.type,
        driverName: ambulanceForm.driverName,
        contact: ambulanceForm.contact,
        currentStatus: ambulanceForm.currentStatus,
        shiftStatus: ambulanceForm.shiftStatus,
        location: {
          address: ambulanceForm.locationAddress,
          lat: ambulanceForm.locationLat,
          lng: ambulanceForm.locationLng,
        },
        equipment: {
          oxygenCylinder: ambulanceForm.oxygenCylinder,
          defibrillator: ambulanceForm.defibrillator,
          ventilator: ambulanceForm.ventilator,
          stretcher: ambulanceForm.stretcher,
        },
        maintenance: {
          currentKm: ambulanceForm.currentKm,
          serviceDueKm: ambulanceForm.serviceDueKm,
        },
        billing: {
          pricingModel: ambulanceForm.pricingModel,
          perKmRate: ambulanceForm.perKmRate,
          flatRate: ambulanceForm.flatRate,
        },
        notes: ambulanceForm.notes,
      });

      setAmbulanceForm(emptyAmbulanceForm);
      showMessage('Ambulance registered successfully.', 'success');
      fetchDashboard();
    } catch (error) {
      console.error('Ambulance create failed:', error);
      showMessage(error.response?.data?.error || 'Unable to register ambulance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post('/api/ambulance/requests', {
        patientId: requestForm.patientId,
        patientName: requestForm.patientName,
        patientPhone: requestForm.patientPhone,
        pickupAddress: requestForm.pickupAddress,
        pickupLat: requestForm.pickupLat,
        pickupLng: requestForm.pickupLng,
        destinationName: requestForm.destinationName,
        destinationAddress: requestForm.destinationAddress,
        destinationType: requestForm.destinationType,
        destinationLat: requestForm.destinationLat,
        destinationLng: requestForm.destinationLng,
        urgencyLevel: requestForm.urgencyLevel,
        assignedDriver: requestForm.assignedDriver,
        billing: {
          pricingModel: requestForm.pricingModel,
        },
      });

      setRequestForm(emptyRequestForm);
      showMessage(`Booking created. Tracking code: ${response.data.data.trackingCode}`, 'success');
      fetchDashboard();
    } catch (error) {
      console.error('Request create failed:', error);
      showMessage(error.response?.data?.error || 'Unable to create ambulance booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const assignRequest = async (requestId, ambulance) => {
    try {
      const response = await axios.post(`/api/ambulance/requests/${requestId}/assign`, {
        ambulanceId: ambulance._id,
        assignedDriver: ambulance.driverName,
      });
      showMessage(`${ambulance.vehicleNumber} assigned to ${response.data.data.patientId}.`, 'success');
      fetchDashboard();
    } catch (error) {
      console.error('Assign failed:', error);
      showMessage(error.response?.data?.error || 'Assignment failed.', 'error');
    }
  };

  const updateDriverShift = async (nextShiftStatus) => {
    if (!selectedDriverAmbulance) return;

    try {
      await axios.patch(`/api/ambulance/fleet/${selectedDriverAmbulance._id}`, {
        shiftStatus: nextShiftStatus,
      });
      showMessage(`Driver shift marked as ${nextShiftStatus}.`, 'success');
      fetchDashboard();
    } catch (error) {
      console.error('Shift update failed:', error);
      showMessage('Unable to update shift status.', 'error');
    }
  };

  const updateDriverVehicleStatus = async (nextStatus) => {
    if (!selectedDriverAmbulance) return;

    try {
      await axios.patch(`/api/ambulance/fleet/${selectedDriverAmbulance._id}`, {
        currentStatus: nextStatus,
      });
      showMessage(`Ambulance status updated to ${nextStatus}.`, 'success');
      fetchDashboard();
    } catch (error) {
      console.error('Vehicle status update failed:', error);
      showMessage('Unable to update ambulance status.', 'error');
    }
  };

  const updateDriverTrip = async (nextStatus) => {
    if (!driverActiveRequest) return;

    try {
      await axios.patch(`/api/ambulance/requests/${driverActiveRequest._id}/status`, {
        requestStatus: nextStatus,
        currentKm: tripLog.currentKm,
        logs: {
          distanceKm: tripLog.distanceKm,
          fuelLitres: tripLog.fuelLitres,
        },
      });

      if (nextStatus === 'Completed') {
        setTripLog(emptyTripLog);
      }

      showMessage(`Trip status updated to ${nextStatus}.`, 'success');
      fetchDashboard();
      if (trackingCode) {
        fetchTracking(trackingCode);
      }
    } catch (error) {
      console.error('Trip status update failed:', error);
      showMessage(error.response?.data?.error || 'Unable to update trip status.', 'error');
    }
  };

  const submitMaintenanceReport = async (event) => {
    event.preventDefault();
    if (!selectedDriverAmbulance) return;

    setSubmitting(true);

    try {
      await axios.post(`/api/ambulance/fleet/${selectedDriverAmbulance._id}/maintenance-report`, {
        issueTitle: maintenanceForm.issueTitle,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        currentKm: maintenanceForm.currentKm,
        locationAddress: maintenanceForm.locationAddress,
      });

      setMaintenanceForm({
        ...emptyMaintenanceForm,
        currentKm: String(selectedDriverAmbulance.maintenance?.currentKm || ''),
        locationAddress: selectedDriverAmbulance.location?.address || '',
      });
      showMessage('Maintenance report sent to admin successfully.', 'success');
      fetchDashboard();
    } catch (error) {
      console.error('Maintenance report failed:', error);
      showMessage(error.response?.data?.error || 'Unable to send maintenance report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const searchTracking = async (event) => {
    event.preventDefault();
    if (!trackingCode.trim()) return;

    syncHashState('tracking', trackingCode.trim());
    await fetchTracking(trackingCode.trim());
  };

  const copyTrackingLink = async (request) => {
    try {
      await navigator.clipboard.writeText(request.trackingLink);
      showMessage('Tracking link copied to clipboard.', 'success');
    } catch (error) {
      console.error('Copy failed:', error);
      showMessage('Could not copy link automatically.', 'error');
    }
  };

  const maintenanceCards = dashboard.ambulances.filter((item) => item.maintenanceAlert?.level !== 'ok');
  const availableAmbulances = dashboard.ambulances.filter((item) => item.currentStatus === 'Available');
  const activeRequests = dashboard.requests.filter((item) => !['Completed', 'Cancelled'].includes(item.requestStatus));
  const maintenanceInbox = dashboard.ambulances
    .flatMap((ambulance) => (ambulance.maintenanceReports || []).map((report) => ({
      ...report,
      ambulanceId: ambulance._id,
      vehicleNumber: ambulance.vehicleNumber,
      ambulanceType: ambulance.type,
      driverName: ambulance.driverName,
      contact: ambulance.contact,
    })))
    .sort((left, right) => new Date(right.reportedAt || 0) - new Date(left.reportedAt || 0));

  const renderFleetCardsSection = (title, description) => (
    <SectionCard
      title={title}
      description={description}
      icon={PackageCheck}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.ambulances.map((ambulance) => (
          <motion.article
            key={ambulance._id}
            whileHover={{ y: -4 }}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(15,35,64,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{ambulance.type}</p>
                <h4 className="mt-2 text-xl font-extrabold text-slate-900">{ambulance.vehicleNumber}</h4>
                <p className="mt-1 text-sm text-slate-500">{ambulance.driverName}</p>
              </div>
              <StatusPill value={ambulance.currentStatus} />
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                {ambulance.contact}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                {ambulance.location?.address || 'Waiting for GPS ping'}
              </div>
              <div className="flex items-center gap-2">
                <TimerReset className="h-4 w-4 text-slate-400" />
                Shift: {ambulance.shiftStatus}
              </div>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Equipment</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ['Oxygen Cylinder', ambulance.equipment?.oxygenCylinder],
                  ['Defibrillator', ambulance.equipment?.defibrillator],
                  ['Ventilator', ambulance.equipment?.ventilator],
                  ['Stretcher', ambulance.equipment?.stretcher],
                ].map(([label, enabled]) => (
                  <span
                    key={label}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className={`mt-5 rounded-[1.4rem] border p-4 text-sm ${
              ambulance.maintenanceAlert?.level === 'due'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : ambulance.maintenanceAlert?.level === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <Wrench className="h-4 w-4" />
                {ambulance.maintenanceAlert?.message}
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] opacity-80">
                KM {ambulance.maintenance?.currentKm || 0} / Due {ambulance.maintenance?.serviceDueKm || 0}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </SectionCard>
  );

  const renderAdminView = () => (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatTile icon={Ambulance} label="Fleet" value={dashboard.stats.totalAmbulances} accent="bg-cyan-50 text-cyan-700" />
        <StatTile icon={CheckCircle2} label="Available" value={dashboard.stats.availableAmbulances} accent="bg-emerald-50 text-emerald-700" />
        <StatTile icon={BellRing} label="Active Requests" value={dashboard.stats.activeRequests} accent="bg-rose-50 text-rose-700" />
        <StatTile icon={Wrench} label="Maintenance Alerts" value={dashboard.stats.maintenanceAlerts} accent="bg-amber-50 text-amber-700" />
        <StatTile icon={AlertTriangle} label="New Reports" value={dashboard.stats.pendingMaintenanceReports} accent="bg-orange-50 text-orange-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Real-time Fleet Map"
          description="Track live ambulance positions, patient pickup points, and quick operational context from one screen."
          icon={MapPin}
        >
          <FleetMap ambulances={dashboard.ambulances} requests={activeRequests} focusedAmbulance={focusedAmbulance} />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboard.ambulances.map((ambulance) => (
              <button
                key={ambulance._id}
                type="button"
                onClick={() => setFocusedAmbulanceId(ambulance._id)}
                className={`rounded-[1.4rem] border px-4 py-3 text-left transition-all ${
                  focusedAmbulanceId === ambulance._id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{ambulance.vehicleNumber}</p>
                    <p className={`text-xs ${focusedAmbulanceId === ambulance._id ? 'text-slate-300' : 'text-slate-500'}`}>{ambulance.driverName}</p>
                  </div>
                  <StatusPill value={ambulance.currentStatus} />
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Dispatch Pulse"
          description="See urgent activity, maintenance risks, and billing automation at a glance."
          icon={Activity}
        >
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <div>
                  <p className="font-bold text-slate-900">Critical requests</p>
                  <p className="text-sm text-slate-500">{dashboard.stats.criticalRequests} high-priority cases need the fastest crew.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-bold text-slate-900">Maintenance due</p>
                  <p className="text-sm text-slate-500">
                    {maintenanceCards.length > 0
                      ? maintenanceCards.map((ambulance) => ambulance.vehicleNumber).join(', ')
                      : 'All ambulances are within safe service range.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">Billing sync</p>
                  <p className="text-sm text-slate-500">Trip completion automatically prepares estimated ambulance charges for the patient bill.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Maintenance Inbox"
        description="Drivers can now send maintenance information from their side. New reports from ambulances in maintenance appear here for admin review."
        icon={Wrench}
      >
        {maintenanceInbox.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {maintenanceInbox.map((report) => (
              <div key={report._id} className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{report.ambulanceType} • {report.vehicleNumber}</p>
                    <h4 className="mt-2 text-lg font-extrabold text-slate-900">{report.issueTitle}</h4>
                    <p className="mt-1 text-sm text-slate-500">Reported by {report.reportedBy || report.driverName} on {formatDateTime(report.reportedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      report.priority === 'High'
                        ? 'bg-rose-100 text-rose-700'
                        : report.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {report.priority} Priority
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      report.status === 'New'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{report.description}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Gauge className="h-4 w-4 text-slate-400" />
                      Current KM
                    </div>
                    <p className="mt-2">{report.currentKm || 'Not shared'}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      Driver Location
                    </div>
                    <p className="mt-2">{report.locationAddress || 'Not shared'}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <UserRound className="h-4 w-4 text-slate-400" />
                      Driver
                    </div>
                    <p className="mt-2">{report.reportedBy || report.driverName}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Phone className="h-4 w-4 text-slate-400" />
                      Contact
                    </div>
                    <p className="mt-2">{report.reportedContact || report.contact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.7rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            No driver-submitted maintenance reports yet.
          </div>
        )}
      </SectionCard>

      {renderFleetCardsSection(
        'Vehicle Cards',
        'Status-aware fleet cards surface driver info, equipment availability, and service alerts instantly.',
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Ambulance Details"
          description="Register fleet details including vehicle type, driver, service range, and onboard life-saving equipment."
          icon={ClipboardPlus}
        >
          <form onSubmit={submitAmbulance} className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Vehicle Number</FieldLabel>
              <input name="vehicleNumber" value={ambulanceForm.vehicleNumber} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="DL-1RT-2210" />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <select name="type" value={ambulanceForm.type} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500">
                {VEHICLE_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Driver Name</FieldLabel>
              <input name="driverName" value={ambulanceForm.driverName} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Driver name" />
            </div>
            <div>
              <FieldLabel>Contact</FieldLabel>
              <input name="contact" value={ambulanceForm.contact} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="+91 98xxxxxx" />
            </div>
            <div>
              <FieldLabel>Current Status</FieldLabel>
              <select name="currentStatus" value={ambulanceForm.currentStatus} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500">
                {AMBULANCE_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Shift Status</FieldLabel>
              <select name="shiftStatus" value={ambulanceForm.shiftStatus} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500">
                <option>On Shift</option>
                <option>Off Shift</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Current Address</FieldLabel>
              <input name="locationAddress" value={ambulanceForm.locationAddress} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Base station or latest address" />
            </div>
            <div>
              <FieldLabel>Latitude</FieldLabel>
              <input name="locationLat" value={ambulanceForm.locationLat} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" />
            </div>
            <div>
              <FieldLabel>Longitude</FieldLabel>
              <input name="locationLng" value={ambulanceForm.locationLng} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" />
            </div>
            <div>
              <FieldLabel>Current KM</FieldLabel>
              <input name="currentKm" value={ambulanceForm.currentKm} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="18240" />
            </div>
            <div>
              <FieldLabel>Service Due KM</FieldLabel>
              <input name="serviceDueKm" value={ambulanceForm.serviceDueKm} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="18500" />
            </div>
            <div>
              <FieldLabel>Pricing Model</FieldLabel>
              <select name="pricingModel" value={ambulanceForm.pricingModel} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500">
                <option value="distance">Distance</option>
                <option value="flat">Flat</option>
              </select>
            </div>
            <div>
              <FieldLabel>Per KM Rate</FieldLabel>
              <input name="perKmRate" value={ambulanceForm.perKmRate} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" />
            </div>
            <div>
              <FieldLabel>Flat Rate</FieldLabel>
              <input name="flatRate" value={ambulanceForm.flatRate} onChange={handleAmbulanceField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Equipment Tracking</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['oxygenCylinder', 'Oxygen Cylinder'],
                  ['defibrillator', 'Defibrillator'],
                  ['ventilator', 'Ventilator'],
                  ['stretcher', 'Stretcher'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    <input type="checkbox" name={key} checked={ambulanceForm[key]} onChange={handleAmbulanceField} className="h-4 w-4 accent-cyan-600" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Notes</FieldLabel>
              <textarea name="notes" value={ambulanceForm.notes} onChange={handleAmbulanceField} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Any readiness or maintenance notes" />
            </div>
            <button type="submit" disabled={submitting} className="primary-button md:col-span-2">
              <Send className="h-4 w-4" />
              Save Ambulance
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Request / Booking"
          description="Capture patient pickup details, urgency, destination, and create a live patient tracking link instantly."
          icon={Route}
        >
          <form onSubmit={submitRequest} className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Patient ID</FieldLabel>
              <input name="patientId" value={requestForm.patientId} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="PAT-2045" />
            </div>
            <div>
              <FieldLabel>Assigned Driver</FieldLabel>
              <input name="assignedDriver" value={requestForm.assignedDriver} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Optional preferred driver" />
            </div>
            <div>
              <FieldLabel>Patient Name</FieldLabel>
              <input name="patientName" value={requestForm.patientName} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Patient name" />
            </div>
            <div>
              <FieldLabel>Patient Contact</FieldLabel>
              <input name="patientPhone" value={requestForm.patientPhone} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="+91 98xxxxxx" />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Pickup Address</FieldLabel>
              <input name="pickupAddress" value={requestForm.pickupAddress} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Street, sector, landmark" />
            </div>
            <div>
              <FieldLabel>Pickup Latitude</FieldLabel>
              <input name="pickupLat" value={requestForm.pickupLat} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" />
            </div>
            <div>
              <FieldLabel>Pickup Longitude</FieldLabel>
              <input name="pickupLng" value={requestForm.pickupLng} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" />
            </div>
            <div>
              <FieldLabel>Destination Name</FieldLabel>
              <input name="destinationName" value={requestForm.destinationName} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" />
            </div>
            <div>
              <FieldLabel>Destination Type</FieldLabel>
              <select name="destinationType" value={requestForm.destinationType} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500">
                <option>Hospital</option>
                <option>Out-station</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Destination Address</FieldLabel>
              <input name="destinationAddress" value={requestForm.destinationAddress} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Hospital or out-station address" />
            </div>
            <div>
              <FieldLabel>Urgency Level</FieldLabel>
              <select name="urgencyLevel" value={requestForm.urgencyLevel} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500">
                {URGENCY_LEVELS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Billing Model</FieldLabel>
              <select name="pricingModel" value={requestForm.pricingModel} onChange={handleRequestField} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500">
                <option value="distance">Distance-based</option>
                <option value="flat">Flat rate</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} className="primary-button md:col-span-2">
              <ClipboardPlus className="h-4 w-4" />
              Create Booking
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard
        title="One-click Assignment Board"
        description="Dispatchers can instantly match live requests with available ambulances and share tracking links with patients."
        icon={BellRing}
        rightAction={(
          <button type="button" onClick={fetchDashboard} className="secondary-button px-4 py-3 text-sm">
            <RefreshCcw className="h-4 w-4 text-cyan-700" />
            Refresh
          </button>
        )}
      >
        <div className="space-y-5">
          {dashboard.requests.map((request) => (
            <div key={request._id} className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-xl font-extrabold text-slate-900">{request.patientId}</h4>
                    <StatusPill value={request.requestStatus} type="request" />
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      request.urgencyLevel === 'Critical'
                        ? 'bg-rose-100 text-rose-700'
                        : request.urgencyLevel === 'Moderate'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {request.urgencyLevel}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Pickup</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{request.pickupLocation?.address}</p>
                      <p className="mt-1 text-xs text-slate-500">GPS: {request.pickupLocation?.lat}, {request.pickupLocation?.lng}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Destination</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{request.destination?.name || request.destination?.address}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.destination?.type}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">ETA</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{request.etaMinutes ? `${request.etaMinutes} min` : 'Pending assignment'}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Estimated Bill</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{formatCurrency(request.billing?.estimatedAmount)}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Tracking</p>
                      <button type="button" onClick={() => copyTrackingLink(request)} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-cyan-700">
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-3">
                  {request.assignedAmbulance ? (
                    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Assigned Unit</p>
                      <p className="mt-2 text-lg font-extrabold text-slate-900">{request.assignedAmbulance.vehicleNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">{request.assignedDriver} • {request.assignedAmbulance.contact}</p>
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Available for One-click Assignment</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {availableAmbulances.length > 0 ? availableAmbulances.map((ambulance) => (
                          <button
                            key={ambulance._id}
                            type="button"
                            onClick={() => assignRequest(request._id, ambulance)}
                            className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                          >
                            {ambulance.vehicleNumber}
                          </button>
                        )) : (
                          <span className="text-sm text-slate-500">No available ambulance right now.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderDriverView = () => (
    <div className="mx-auto max-w-md space-y-6">
      <SectionCard
        title="Driver Mobile View"
        description="Live assignment alerts, route launch, shift control, and trip logs for rapid turnaround in the field."
        icon={Navigation}
      >
        <div className="space-y-5">
          <div>
            <FieldLabel>Select Ambulance</FieldLabel>
            <select
              value={selectedDriverAmbulanceId}
              onChange={(event) => setSelectedDriverAmbulanceId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
            >
              {dashboard.ambulances.map((ambulance) => (
                <option key={ambulance._id} value={ambulance._id}>
                  {ambulance.vehicleNumber} - {ambulance.driverName}
                </option>
              ))}
            </select>
          </div>

          {selectedDriverAmbulance && (
            <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{selectedDriverAmbulance.type}</p>
                  <h4 className="mt-2 text-xl font-extrabold text-slate-900">{selectedDriverAmbulance.vehicleNumber}</h4>
                  <p className="mt-1 text-sm text-slate-500">{selectedDriverAmbulance.driverName}</p>
                </div>
                <StatusPill value={selectedDriverAmbulance.currentStatus} />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => updateDriverShift('On Shift')}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${
                    selectedDriverAmbulance.shiftStatus === 'On Shift'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Start Shift
                </button>
                <button
                  type="button"
                  onClick={() => updateDriverShift('Off Shift')}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${
                    selectedDriverAmbulance.shiftStatus === 'Off Shift'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  End Shift
                </button>
                <button
                  type="button"
                  onClick={() => updateDriverVehicleStatus('Maintenance')}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${
                    selectedDriverAmbulance.currentStatus === 'Maintenance'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Set Maintenance
                </button>
              </div>
              {geoError && (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{geoError}</p>
              )}
            </div>
          )}

          {selectedDriverAmbulance?.currentStatus === 'Maintenance' && (
            <div className="space-y-4 rounded-[1.7rem] border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <Wrench className="mt-1 h-5 w-5 text-amber-700" />
                <div>
                  <p className="font-bold text-slate-900">Send Maintenance Information To Admin</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Jab ambulance maintenance par ho, driver yahan se issue details admin ko bhej sakta hai.
                  </p>
                </div>
              </div>

              <form onSubmit={submitMaintenanceReport} className="grid gap-3">
                <div>
                  <FieldLabel>Issue Title</FieldLabel>
                  <input
                    name="issueTitle"
                    value={maintenanceForm.issueTitle}
                    onChange={handleMaintenanceField}
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none focus:border-amber-500"
                    placeholder="Brake issue, AC fault, oxygen mount loose..."
                  />
                </div>
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    name="description"
                    value={maintenanceForm.description}
                    onChange={handleMaintenanceField}
                    className="min-h-28 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none focus:border-amber-500"
                    placeholder="Problem kab start hua, kya symptom hai, aur emergency usability par kya impact hai."
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FieldLabel>Priority</FieldLabel>
                    <select
                      name="priority"
                      value={maintenanceForm.priority}
                      onChange={handleMaintenanceField}
                      className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none focus:border-amber-500"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Current KM</FieldLabel>
                    <input
                      name="currentKm"
                      value={maintenanceForm.currentKm}
                      onChange={handleMaintenanceField}
                      className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none focus:border-amber-500"
                      placeholder="Odometer"
                    />
                  </div>
                  <div>
                    <FieldLabel>Location</FieldLabel>
                    <input
                      name="locationAddress"
                      value={maintenanceForm.locationAddress}
                      onChange={handleMaintenanceField}
                      className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none focus:border-amber-500"
                      placeholder="Workshop or roadside location"
                    />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700">
                  Send To Admin
                </button>
              </form>
            </div>
          )}

          {driverAlert && driverAlert.assignedAmbulance?._id === selectedDriverAmbulance?._id && (
            <div className="rounded-[1.7rem] border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-start gap-3">
                <BellRing className="mt-1 h-5 w-5 text-rose-600" />
                <div>
                  <p className="font-bold text-slate-900">New Request Alert</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Pickup for {driverAlert.patientId} at {driverAlert.pickupLocation?.address}. Reach in approximately {driverAlert.etaMinutes || 'few'} minutes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {driverActiveRequest ? (
            <div className="space-y-4 rounded-[1.7rem] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Active Trip</p>
                  <h4 className="mt-2 text-xl font-extrabold text-slate-900">{driverActiveRequest.patientId}</h4>
                  <p className="mt-1 text-sm text-slate-500">{driverActiveRequest.pickupLocation?.address}</p>
                </div>
                <StatusPill value={driverActiveRequest.requestStatus} type="request" />
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Navigation</p>
                  <a
                    href={buildDirectionsLink(driverActiveRequest, selectedDriverAmbulance)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-cyan-700"
                  >
                    <LocateFixed className="h-4 w-4" />
                    Open in Google Maps
                  </a>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">ETA</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{driverActiveRequest.etaMinutes ? `${driverActiveRequest.etaMinutes} min` : 'Updating'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Assigned Driver</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{driverActiveRequest.assignedDriver || selectedDriverAmbulance?.driverName}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <FieldLabel>Trip Logs</FieldLabel>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input name="distanceKm" value={tripLog.distanceKm} onChange={handleTripLogField} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Distance KM" />
                  <input name="fuelLitres" value={tripLog.fuelLitres} onChange={handleTripLogField} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Fuel litres" />
                  <input name="currentKm" value={tripLog.currentKm} onChange={handleTripLogField} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Odometer" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button type="button" onClick={() => updateDriverTrip('Picked up')} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                    Picked Up
                  </button>
                  <button type="button" onClick={() => updateDriverTrip('Dropped')} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
                    Dropped
                  </button>
                  <button type="button" onClick={() => updateDriverTrip('Completed')} className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white">
                    Trip End
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.7rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              No active request is assigned to this ambulance right now.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );

  const renderPublicView = () => (
    <div className="space-y-6">
      <div className="surface-panel-strong overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Public Fleet View</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Ambulance availability aur vehicle cards yahin dekhiye.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              Public page par sirf fleet information visible hai. Dispatch, booking, driver workflow, aur assignment tools admin workspace ke andar hi rakhe gaye hain.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Available</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{dashboard.stats.availableAmbulances}</p>
            </div>
            <div className="rounded-[1.4rem] bg-rose-50 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Busy</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{dashboard.stats.busyAmbulances}</p>
            </div>
            <div className="rounded-[1.4rem] bg-amber-50 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Maintenance</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{dashboard.stats.maintenanceAmbulances}</p>
            </div>
          </div>
        </div>
      </div>

      {renderFleetCardsSection(
        'Ambulance Fleet Cards',
        'Public users ke liye sirf vehicle cards visible hain. Operational controls admin panel ke andar move kar diye gaye hain.',
      )}
    </div>
  );

  const renderTrackingView = () => (
    <div className="space-y-6">
      <SectionCard
        title="Patient Tracking"
        description="Share the tracking code or direct link with patients so they can see ETA, ambulance distance, and live status updates."
        icon={Hospital}
      >
        <form onSubmit={searchTracking} className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={trackingCode}
            onChange={(event) => setTrackingCode(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
            placeholder="Enter tracking code like TRK-1102"
          />
          <button type="submit" className="primary-button px-6">
            <SearchIcon />
            Track Ambulance
          </button>
        </form>
      </SectionCard>

      {trackingData ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <SectionCard
            title={`Tracking ${trackingData.trackingCode}`}
            description="Patients can use this view to know how far the ambulance is and when it should arrive."
            icon={LocateFixed}
            rightAction={(
              <button type="button" onClick={() => copyTrackingLink(trackingData)} className="secondary-button px-4 py-3 text-sm">
                <Copy className="h-4 w-4 text-cyan-700" />
                Copy Link
              </button>
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.6rem] bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Current Status</p>
                <div className="mt-3">
                  <StatusPill value={trackingData.requestStatus} type="request" />
                </div>
                <p className="mt-4 text-sm text-slate-600">Ambulance distance: {trackingData.patientDistanceKm ? `${round(trackingData.patientDistanceKm)} km` : 'Calculating...'}</p>
                <p className="mt-2 text-sm text-slate-600">ETA: {trackingData.etaMinutes ? `${trackingData.etaMinutes} minutes` : 'Updating...'}</p>
              </div>

              <div className="rounded-[1.6rem] bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Assigned Ambulance</p>
                {trackingData.assignedAmbulance ? (
                  <>
                    <p className="mt-3 text-lg font-extrabold text-slate-900">{trackingData.assignedAmbulance.vehicleNumber}</p>
                    <p className="mt-2 text-sm text-slate-600">{trackingData.assignedDriver} • {trackingData.assignedAmbulance.contact}</p>
                    <p className="mt-2 text-sm text-slate-600">{trackingData.assignedAmbulance.location?.address || 'Waiting for latest GPS'}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Dispatcher is preparing a vehicle for this request.</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Pickup</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">{trackingData.pickupLocation?.address}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Destination</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">{trackingData.destination?.address}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Bill Sync</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {trackingData.billing?.addedToMainBill ? 'Added to main bill' : 'Ready to sync on trip close'}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Live ETA Panel"
            description="Tracking updates refresh through Socket.io whenever the driver location changes or trip status moves forward."
            icon={Clock3}
          >
            <FleetMap
              ambulances={trackingData.assignedAmbulance ? [trackingData.assignedAmbulance] : []}
              requests={[trackingData]}
              focusedAmbulance={trackingData.assignedAmbulance || focusedAmbulance}
            />
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-cyan-700" />
                  <div>
                    <p className="font-bold text-slate-900">Estimated arrival</p>
                    <p className="text-sm text-slate-500">{trackingData.etaMinutes ? `${trackingData.etaMinutes} minutes from the latest GPS ping.` : 'Waiting for live driver location.'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <TimerReset className="h-5 w-5 text-cyan-700" />
                  <div>
                    <p className="font-bold text-slate-900">Trip logs</p>
                    <p className="text-sm text-slate-500">Start: {formatDateTime(trackingData.logs?.tripStartTime)}</p>
                    <p className="text-sm text-slate-500">End: {formatDateTime(trackingData.logs?.tripEndTime)}</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center text-slate-500">
          Search a tracking code to see live ambulance ETA and status.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {!isPublicMode && (
        <>
          <div className="surface-dark rounded-[2rem] px-6 py-7 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Ambulance Command Center</p>
            <h2 className="mt-3 text-3xl font-extrabold text-white">Dispatch, driver workflow, and patient tracking in one connected module.</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200">
              Real-time fleet status, quick assignment, mobile driver actions, equipment visibility, billing readiness, and maintenance alerts now stay on the same operational loop.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              ['admin', 'Control Center'],
              ['driver', 'Driver Mobile'],
              ['tracking', 'Patient Tracking'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setView(value);
                }}
                className={`rounded-full px-5 py-3 text-sm font-bold transition-all ${
                  view === value
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {message.text && (
        <div className={`rounded-[1.6rem] border px-5 py-4 text-sm font-semibold ${
          message.type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="surface-panel-strong flex min-h-[280px] items-center justify-center rounded-[2rem]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="mx-auto mb-4 h-14 w-14 rounded-full border-4 border-cyan-200 border-t-cyan-700"
            />
            <p className="font-semibold text-cyan-700">Loading ambulance operations...</p>
          </div>
        </div>
      ) : (
        <>
          {isPublicMode && view === 'public' && renderPublicView()}
          {isPublicMode && view === 'tracking' && renderTrackingView()}
          {view === 'admin' && renderAdminView()}
          {view === 'driver' && renderDriverView()}
          {!isPublicMode && view === 'tracking' && renderTrackingView()}
        </>
      )}
    </div>
  );
}

function SearchIcon() {
  return <RefreshCcw className="h-4 w-4" />;
}
