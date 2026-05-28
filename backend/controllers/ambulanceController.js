import mongoose from 'mongoose';
import Ambulance from '../models/Ambulance.js';
import AmbulanceRequest from '../models/AmbulanceRequest.js';
import User from '../models/User.js';
import {
  createAmbulanceSeedData,
  createAmbulanceRequestSeedData,
  createFallbackAmbulance,
  createFallbackRequest,
  getFallbackAmbulanceById,
  getFallbackAmbulances,
  getFallbackRequestById,
  getFallbackRequestByTrackingCode,
  getFallbackRequests,
  updateFallbackAmbulance,
  updateFallbackRequest,
} from '../utils/ambulanceFallbackStore.js';
import { getSocketServer } from '../utils/socketServer.js';

const AMBULANCE_STATUSES = ['Available', 'Busy', 'Maintenance'];
const SHIFT_STATUSES = ['On Shift', 'Off Shift'];
const VEHICLE_TYPES = ['AC', 'Non-AC', 'ICU', 'Oxygen-supported'];
const URGENCY_LEVELS = ['Low', 'Moderate', 'Critical'];
const REQUEST_STATUSES = ['Pending', 'Assigned', 'Picked up', 'Dropped', 'Completed', 'Cancelled'];
const TRACKABLE_STATUSES = new Set(['Assigned', 'Picked up', 'Dropped']);
const AVERAGE_SPEED_BY_URGENCY = {
  Low: 28,
  Moderate: 34,
  Critical: 42,
};

const toPlain = (value) => (value?.toObject ? value.toObject() : value);

const round = (value, decimals = 1) => {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizePhoneDigits = (value) => sanitizeText(value).replace(/[^\d]/g, '');

const getPhoneLookupValues = (value) => {
  const digits = normalizePhoneDigits(value);
  if (!digits) return [];

  const variants = new Set([digits]);
  if (digits.length > 10) {
    variants.add(digits.slice(-10));
  }

  return Array.from(variants);
};

const normalizeChoice = (value, allowedValues, fallback) => {
  if (typeof value !== 'string') return fallback;
  const normalized = allowedValues.find(
    (item) => item.toLowerCase() === value.trim().toLowerCase(),
  );
  return normalized || fallback;
};

const isDbConnected = () => mongoose.connection.readyState === 1;

const buildPatientLookupFilters = (user) => {
  if (!user?._id) return [];

  const filters = [
    { patientUser: user._id },
    { patientId: user._id.toString() },
  ];

  const phoneLookupValues = getPhoneLookupValues(user.phone);
  if (phoneLookupValues.length > 0) {
    filters.push({ patientPhoneNormalized: { $in: phoneLookupValues } });
    phoneLookupValues.forEach((digits) => {
      filters.push({ patientPhone: new RegExp(`${digits}$`) });
    });
  }

  return filters;
};

const findMatchingPatientUserId = async ({ patientUserId, patientId, patientPhone }) => {
  const explicitId = [patientUserId, patientId]
    .map(sanitizeText)
    .find((value) => mongoose.isValidObjectId(value));

  if (!isDbConnected()) {
    return explicitId || null;
  }

  if (explicitId) {
    const explicitUser = await User.findById(explicitId).select('_id');
    if (explicitUser) {
      return explicitUser._id;
    }
  }

  const phoneLookupValues = getPhoneLookupValues(patientPhone);
  if (phoneLookupValues.length === 0) {
    return null;
  }

  const matchedUser = await User.findOne({
    $or: phoneLookupValues.map((digits) => ({ phone: new RegExp(`${digits}$`) })),
  }).select('_id');

  return matchedUser?._id || null;
};

const haversineDistance = (origin, destination) => {
  if (
    origin?.lat == null
    || origin?.lng == null
    || destination?.lat == null
    || destination?.lng == null
  ) {
    return null;
  }

  const lat1 = Number(origin.lat);
  const lng1 = Number(origin.lng);
  const lat2 = Number(destination.lat);
  const lng2 = Number(destination.lng);

  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) {
    return null;
  }

  const toRadians = (angle) => (angle * Math.PI) / 180;
  const radius = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;

  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getNavigationTarget = (request) => (
  request?.requestStatus === 'Picked up' ? request.destination : request.pickupLocation
);

const calculateEtaContext = (ambulance, request) => {
  if (!ambulance || !request) {
    return { distanceKm: null, etaMinutes: null };
  }

  const target = getNavigationTarget(request);
  const distanceKm = haversineDistance(ambulance.location, target);
  if (distanceKm === null) {
    return { distanceKm: null, etaMinutes: null };
  }

  const averageSpeed = AVERAGE_SPEED_BY_URGENCY[request.urgencyLevel] || AVERAGE_SPEED_BY_URGENCY.Moderate;
  const etaMinutes = Math.max(1, Math.round((distanceKm / averageSpeed) * 60));

  return {
    distanceKm: round(distanceKm, 1),
    etaMinutes,
  };
};

const normalizeLocation = (rawLocation = {}, addressFallback = '') => {
  const lat = toNumber(rawLocation.lat ?? rawLocation.latitude);
  const lng = toNumber(rawLocation.lng ?? rawLocation.longitude);
  const address = sanitizeText(rawLocation.address || addressFallback);

  if (lat === null || lng === null) {
    return {
      address,
      updatedAt: rawLocation.updatedAt ? new Date(rawLocation.updatedAt) : new Date(),
    };
  }

  return {
    lat,
    lng,
    address,
    updatedAt: rawLocation.updatedAt ? new Date(rawLocation.updatedAt) : new Date(),
  };
};

const buildMaintenanceAlert = (ambulance) => {
  const currentKm = toNumber(ambulance?.maintenance?.currentKm) || 0;
  const serviceDueKm = toNumber(ambulance?.maintenance?.serviceDueKm) || 0;
  const remainingKm = serviceDueKm - currentKm;

  if (!serviceDueKm) {
    return {
      level: 'ok',
      message: 'Service threshold not configured yet.',
      remainingKm: null,
    };
  }

  if (remainingKm <= 0) {
    return {
      level: 'due',
      message: `Service overdue by ${Math.abs(remainingKm)} km.`,
      remainingKm,
    };
  }

  if (remainingKm <= 500) {
    return {
      level: 'warning',
      message: `Service due in ${remainingKm} km.`,
      remainingKm,
    };
  }

  return {
    level: 'ok',
    message: `Service due in ${remainingKm} km.`,
    remainingKm,
  };
};

const getBillingBreakdown = (request, ambulance, distanceKmOverride = null) => {
  const pricingModel = request?.billing?.pricingModel
    || ambulance?.billing?.pricingModel
    || 'distance';

  const distanceKm = distanceKmOverride
    ?? toNumber(request?.logs?.distanceKm)
    ?? toNumber(request?.patientDistanceKm)
    ?? 0;

  const perKmRate = toNumber(ambulance?.billing?.perKmRate) || 45;
  const flatRate = toNumber(ambulance?.billing?.flatRate) || 1200;
  const computedAmount = pricingModel === 'flat' ? flatRate : distanceKm * perKmRate;

  return {
    pricingModel,
    estimatedAmount: request?.billing?.estimatedAmount ?? round(computedAmount, 0),
    finalAmount: request?.billing?.finalAmount ?? null,
    addedToMainBill: request?.billing?.addedToMainBill ?? false,
  };
};

const buildTrackingLink = (req, trackingCode) => {
  const baseUrl = req.headers.origin || process.env.FRONTEND_URL || '';
  return `${baseUrl}/#ambulance?tracking=${trackingCode}`;
};

const withSerializedAmbulance = (ambulance) => {
  if (!ambulance) return null;
  const plain = toPlain(ambulance);
  const maintenanceReports = [...(plain.maintenanceReports || [])]
    .sort((left, right) => new Date(right.reportedAt || 0) - new Date(left.reportedAt || 0));

  return {
    ...plain,
    maintenanceReports,
    latestMaintenanceReport: maintenanceReports[0] || null,
    maintenanceAlert: buildMaintenanceAlert(plain),
  };
};

const withSerializedRequest = (req, request) => {
  if (!request) return null;

  const plain = toPlain(request);
  const assignedAmbulance = plain.assignedAmbulance ? withSerializedAmbulance(plain.assignedAmbulance) : null;
  const etaContext = calculateEtaContext(assignedAmbulance, plain);
  const distanceKm = plain.patientDistanceKm ?? etaContext.distanceKm;

  return {
    ...plain,
    assignedAmbulance,
    etaMinutes: plain.etaMinutes ?? etaContext.etaMinutes,
    patientDistanceKm: distanceKm,
    billing: getBillingBreakdown(plain, assignedAmbulance, plain.logs?.distanceKm ?? distanceKm),
    trackingLink: buildTrackingLink(req, plain.trackingCode),
  };
};

const buildFallbackRequestLookup = () => {
  const ambulances = getFallbackAmbulances();
  const ambulanceMap = new Map(ambulances.map((item) => [item._id, item]));

  return getFallbackRequests().map((request) => ({
    ...request,
    assignedAmbulance: request.assignedAmbulance
      ? ambulanceMap.get(request.assignedAmbulance) || null
      : null,
  }));
};

const stripIdentifier = (record) => {
  const { _id, ...rest } = record;
  return rest;
};

const ensureDbSeedData = async () => {
  if (!isDbConnected()) return;

  const ambulanceCount = await Ambulance.countDocuments();
  if (ambulanceCount > 0) return;

  const seededAmbulances = await Ambulance.insertMany(
    createAmbulanceSeedData().map(stripIdentifier),
  );

  const requestCount = await AmbulanceRequest.countDocuments();
  if (requestCount === 0) {
    const seedRequests = createAmbulanceRequestSeedData(seededAmbulances).map((request) => ({
      ...stripIdentifier(request),
      assignedAmbulance: request.assignedAmbulance || undefined,
    }));
    await AmbulanceRequest.insertMany(seedRequests);
  }
};

const getFleetFromSource = async () => {
  if (!isDbConnected()) {
    return getFallbackAmbulances();
  }

  await ensureDbSeedData();
  return Ambulance.find().sort({ vehicleNumber: 1 }).lean();
};

const getRequestsFromSource = async () => {
  if (!isDbConnected()) {
    return buildFallbackRequestLookup();
  }

  await ensureDbSeedData();
  return AmbulanceRequest.find()
    .sort({ createdAt: -1 })
    .populate('assignedAmbulance')
    .lean();
};

const getMyRequestsFromSource = async (user) => {
  const filters = buildPatientLookupFilters(user);
  if (filters.length === 0) {
    return [];
  }

  if (!isDbConnected()) {
    return buildFallbackRequestLookup()
      .filter((request) => {
        const phoneLookupValues = getPhoneLookupValues(request.patientPhoneNormalized || request.patientPhone);
        const userPhoneLookupValues = getPhoneLookupValues(user.phone);
        const hasPhoneMatch = userPhoneLookupValues.some((digits) => phoneLookupValues.includes(digits));

        return request.patientUser === user._id?.toString()
          || request.patientId === user._id?.toString()
          || hasPhoneMatch;
      })
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
  }

  await ensureDbSeedData();
  return AmbulanceRequest.find({ $or: filters })
    .sort({ createdAt: -1 })
    .populate('assignedAmbulance')
    .lean();
};

const getRequestByIdFromSource = async (requestId) => {
  if (!isDbConnected()) {
    const request = getFallbackRequestById(requestId);
    if (!request) return null;
    return {
      ...request,
      assignedAmbulance: request.assignedAmbulance
        ? getFallbackAmbulanceById(request.assignedAmbulance)
        : null,
    };
  }

  return AmbulanceRequest.findById(requestId).populate('assignedAmbulance');
};

const getAmbulanceByIdFromSource = async (ambulanceId) => {
  if (!isDbConnected()) {
    return getFallbackAmbulanceById(ambulanceId);
  }

  return Ambulance.findById(ambulanceId);
};

const emitDashboardRefresh = (io) => {
  io?.emit('ambulance:dashboard-refresh', {
    updatedAt: new Date().toISOString(),
  });
};

const emitDriverAssignment = (io, ambulance, payload) => {
  if (!io || !ambulance) return;

  const contactRoom = ambulance.contact
    ? `driver:contact:${ambulance.contact.replace(/[^\d]/g, '')}`
    : null;
  const vehicleRoom = ambulance.vehicleNumber
    ? `driver:vehicle:${ambulance.vehicleNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : null;
  const ambulanceRoom = ambulance._id ? `driver:ambulance:${ambulance._id}` : null;

  [contactRoom, vehicleRoom, ambulanceRoom]
    .filter(Boolean)
    .forEach((room) => io.to(room).emit('ambulance:assigned', payload));
};

const emitTrackingUpdate = (io, requestPayload) => {
  if (!io || !requestPayload?.trackingCode) return;
  io.to(`tracking:${requestPayload.trackingCode}`).emit('ambulance:tracking-updated', {
    request: requestPayload,
  });
};

const normalizeAmbulancePayload = (body) => ({
  vehicleNumber: sanitizeText(body.vehicleNumber).toUpperCase(),
  type: normalizeChoice(body.type, VEHICLE_TYPES, 'AC'),
  driverName: sanitizeText(body.driverName),
  contact: sanitizeText(body.contact),
  currentStatus: normalizeChoice(body.currentStatus, AMBULANCE_STATUSES, 'Available'),
  shiftStatus: normalizeChoice(body.shiftStatus, SHIFT_STATUSES, 'Off Shift'),
  location: normalizeLocation(body.location || {}, body.location?.address),
  equipment: {
    oxygenCylinder: Boolean(body.equipment?.oxygenCylinder),
    defibrillator: Boolean(body.equipment?.defibrillator),
    ventilator: Boolean(body.equipment?.ventilator),
    stretcher: body.equipment?.stretcher !== false,
  },
  maintenance: {
    currentKm: toNumber(body.maintenance?.currentKm) || 0,
    serviceDueKm: toNumber(body.maintenance?.serviceDueKm) || 0,
    lastServiceDate: body.maintenance?.lastServiceDate
      ? new Date(body.maintenance.lastServiceDate)
      : null,
  },
  billing: {
    pricingModel: body.billing?.pricingModel === 'flat' ? 'flat' : 'distance',
    perKmRate: toNumber(body.billing?.perKmRate) || 45,
    flatRate: toNumber(body.billing?.flatRate) || 1200,
  },
  notes: sanitizeText(body.notes),
});

const normalizeRequestPayload = (body) => ({
  trackingCode: sanitizeText(body.trackingCode) || `TRK-${Date.now().toString().slice(-5)}`,
  patientId: sanitizeText(body.patientId),
  patientName: sanitizeText(body.patientName),
  patientPhone: sanitizeText(body.patientPhone),
  patientPhoneNormalized: normalizePhoneDigits(body.patientPhone),
  patientUser: sanitizeText(body.patientUserId || body.patientUser),
  pickupLocation: normalizeLocation(
    body.pickupLocation || {
      address: body.pickupAddress,
      lat: body.pickupLat,
      lng: body.pickupLng,
    },
    body.pickupAddress,
  ),
  destination: {
    name: sanitizeText(body.destination?.name || body.destinationName),
    address: sanitizeText(body.destination?.address || body.destinationAddress),
    type: normalizeChoice(body.destination?.type || body.destinationType, ['Hospital', 'Out-station'], 'Hospital'),
    lat: toNumber(body.destination?.lat || body.destinationLat),
    lng: toNumber(body.destination?.lng || body.destinationLng),
  },
  urgencyLevel: normalizeChoice(body.urgencyLevel, URGENCY_LEVELS, 'Moderate'),
  assignedDriver: sanitizeText(body.assignedDriver),
  requestStatus: normalizeChoice(body.requestStatus, REQUEST_STATUSES, 'Pending'),
  billing: {
    pricingModel: body.billing?.pricingModel === 'flat' ? 'flat' : 'distance',
    estimatedAmount: toNumber(body.billing?.estimatedAmount),
    finalAmount: toNumber(body.billing?.finalAmount),
    addedToMainBill: Boolean(body.billing?.addedToMainBill),
  },
  logs: {
    tripStartTime: body.logs?.tripStartTime ? new Date(body.logs.tripStartTime) : null,
    tripEndTime: body.logs?.tripEndTime ? new Date(body.logs.tripEndTime) : null,
    fuelLitres: toNumber(body.logs?.fuelLitres),
    distanceKm: toNumber(body.logs?.distanceKm),
  },
});

const getDashboardPayload = async (req) => {
  const [ambulances, requests] = await Promise.all([getFleetFromSource(), getRequestsFromSource()]);
  const serializedAmbulances = ambulances.map(withSerializedAmbulance);
  const serializedRequests = requests.map((request) => withSerializedRequest(req, request));

  return {
    ambulances: serializedAmbulances,
    requests: serializedRequests,
    stats: {
      totalAmbulances: serializedAmbulances.length,
      availableAmbulances: serializedAmbulances.filter((item) => item.currentStatus === 'Available').length,
      busyAmbulances: serializedAmbulances.filter((item) => item.currentStatus === 'Busy').length,
      maintenanceAmbulances: serializedAmbulances.filter((item) => item.currentStatus === 'Maintenance').length,
      activeRequests: serializedRequests.filter((item) => !['Completed', 'Cancelled'].includes(item.requestStatus)).length,
      criticalRequests: serializedRequests.filter((item) => item.urgencyLevel === 'Critical').length,
      maintenanceAlerts: serializedAmbulances.filter((item) => item.maintenanceAlert.level !== 'ok').length,
      pendingMaintenanceReports: serializedAmbulances.reduce(
        (count, item) => count + (item.maintenanceReports || []).filter((report) => report.status === 'New').length,
        0,
      ),
    },
  };
};

export const getAmbulanceDashboard = async (req, res) => {
  try {
    const dashboard = await getDashboardPayload(req);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAmbulanceFleet = async (req, res) => {
  try {
    const ambulances = await getFleetFromSource();
    res.status(200).json({
      success: true,
      count: ambulances.length,
      data: ambulances.map(withSerializedAmbulance),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAmbulanceRecord = async (req, res) => {
  try {
    const payload = normalizeAmbulancePayload(req.body);

    if (!payload.vehicleNumber || !payload.driverName || !payload.contact) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle number, driver name, and contact are required.',
      });
    }

    let ambulance;
    if (!isDbConnected()) {
      ambulance = createFallbackAmbulance(payload);
    } else {
      ambulance = await Ambulance.create(payload);
    }

    emitDashboardRefresh(getSocketServer());

    res.status(201).json({
      success: true,
      data: withSerializedAmbulance(ambulance),
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const updateAmbulanceRecord = async (req, res) => {
  try {
    const payload = normalizeAmbulancePayload({
      ...req.body,
      vehicleNumber: req.body.vehicleNumber ?? undefined,
      driverName: req.body.driverName ?? undefined,
      contact: req.body.contact ?? undefined,
    });

    const partialPayload = Object.fromEntries(
      Object.entries({
        vehicleNumber: payload.vehicleNumber || undefined,
        type: req.body.type ? payload.type : undefined,
        driverName: payload.driverName || undefined,
        contact: payload.contact || undefined,
        currentStatus: req.body.currentStatus ? payload.currentStatus : undefined,
        shiftStatus: req.body.shiftStatus ? payload.shiftStatus : undefined,
        location: req.body.location ? payload.location : undefined,
        equipment: req.body.equipment ? payload.equipment : undefined,
        maintenance: req.body.maintenance ? payload.maintenance : undefined,
        billing: req.body.billing ? payload.billing : undefined,
        notes: typeof req.body.notes === 'string' ? payload.notes : undefined,
      }).filter(([, value]) => value !== undefined),
    );

    let ambulance;
    if (!isDbConnected()) {
      ambulance = updateFallbackAmbulance(req.params.ambulanceId, partialPayload);
    } else {
      ambulance = await Ambulance.findByIdAndUpdate(req.params.ambulanceId, partialPayload, {
        returnDocument: 'after',
        runValidators: true,
      });
    }

    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found.' });
    }

    emitDashboardRefresh(getSocketServer());

    res.status(200).json({
      success: true,
      data: withSerializedAmbulance(ambulance),
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const submitMaintenanceReport = async (req, res) => {
  try {
    const issueTitle = sanitizeText(req.body.issueTitle);
    const description = sanitizeText(req.body.description);
    const priority = normalizeChoice(req.body.priority, ['Low', 'Medium', 'High'], 'Medium');
    const currentKm = toNumber(req.body.currentKm);
    const locationAddress = sanitizeText(req.body.locationAddress);

    if (!issueTitle || !description) {
      return res.status(400).json({
        success: false,
        error: 'Issue title and description are required.',
      });
    }

    let ambulance = await getAmbulanceByIdFromSource(req.params.ambulanceId);
    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found.' });
    }

    const plainAmbulance = toPlain(ambulance);
    const maintenanceReport = {
      _id: new mongoose.Types.ObjectId().toString(),
      issueTitle,
      description,
      priority,
      currentKm: currentKm ?? plainAmbulance.maintenance?.currentKm ?? 0,
      locationAddress: locationAddress || plainAmbulance.location?.address || '',
      reportedBy: sanitizeText(req.body.reportedBy) || plainAmbulance.driverName || '',
      reportedContact: sanitizeText(req.body.reportedContact) || plainAmbulance.contact || '',
      reportedAt: new Date(),
      status: 'New',
    };

    if (!isDbConnected()) {
      ambulance = updateFallbackAmbulance(req.params.ambulanceId, {
        currentStatus: 'Maintenance',
        maintenance: currentKm == null
          ? undefined
          : {
              currentKm,
            },
        maintenanceReports: [maintenanceReport, ...(plainAmbulance.maintenanceReports || [])],
      });
    } else {
      const maintenancePatch = currentKm == null
        ? plainAmbulance.maintenance
        : {
            ...(plainAmbulance.maintenance || {}),
            currentKm,
          };

      ambulance = await Ambulance.findByIdAndUpdate(
        req.params.ambulanceId,
        {
          $set: {
            currentStatus: 'Maintenance',
            maintenance: maintenancePatch,
          },
          $push: {
            maintenanceReports: {
              $each: [maintenanceReport],
              $position: 0,
            },
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      );
    }

    const io = getSocketServer();
    io?.emit('ambulance:maintenance-reported', {
      ambulance: withSerializedAmbulance(ambulance),
      report: maintenanceReport,
    });
    emitDashboardRefresh(io);

    res.status(200).json({
      success: true,
      data: withSerializedAmbulance(ambulance),
      report: maintenanceReport,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateAmbulanceLocation = async (req, res) => {
  try {
    const location = normalizeLocation(req.body, req.body.address);
    if (location.lat === undefined || location.lng === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required for location tracking.',
      });
    }

    let ambulance;
    if (!isDbConnected()) {
      ambulance = updateFallbackAmbulance(req.params.ambulanceId, { location });
    } else {
      ambulance = await Ambulance.findByIdAndUpdate(
        req.params.ambulanceId,
        { location },
        { returnDocument: 'after', runValidators: true },
      ).lean();
    }

    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found.' });
    }

    let activeRequest = null;
    if (!isDbConnected()) {
      const fallbackRequest = getFallbackRequests().find(
        (item) => item.assignedAmbulance === req.params.ambulanceId && TRACKABLE_STATUSES.has(item.requestStatus),
      );
      if (fallbackRequest) {
        const etaContext = calculateEtaContext(ambulance, fallbackRequest);
        activeRequest = updateFallbackRequest(fallbackRequest._id, {
          etaMinutes: etaContext.etaMinutes,
          patientDistanceKm: etaContext.distanceKm,
        });
      }
    } else {
      const requestDoc = await AmbulanceRequest.findOne({
        assignedAmbulance: req.params.ambulanceId,
        requestStatus: { $in: Array.from(TRACKABLE_STATUSES) },
      });

      if (requestDoc) {
        const etaContext = calculateEtaContext(ambulance, requestDoc);
        requestDoc.etaMinutes = etaContext.etaMinutes;
        requestDoc.patientDistanceKm = etaContext.distanceKm;
        await requestDoc.save();
        activeRequest = await AmbulanceRequest.findById(requestDoc._id).populate('assignedAmbulance');
      }
    }

    const io = getSocketServer();
    emitDashboardRefresh(io);
    if (activeRequest) {
      emitTrackingUpdate(io, withSerializedRequest(req, activeRequest));
    }

    res.status(200).json({
      success: true,
      data: withSerializedAmbulance(ambulance),
      tracking: activeRequest ? withSerializedRequest(req, activeRequest) : null,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAmbulanceRequests = async (req, res) => {
  try {
    const requests = await getRequestsFromSource();
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests.map((request) => withSerializedRequest(req, request)),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyAmbulanceRequests = async (req, res) => {
  try {
    const requests = await getMyRequestsFromSource(req.user);
    const serializedRequests = requests.map((request) => withSerializedRequest(req, request));
    const activeRequest = serializedRequests.find(
      (request) => !['Completed', 'Cancelled'].includes(request.requestStatus),
    ) || serializedRequests[0] || null;

    res.status(200).json({
      success: true,
      data: {
        activeRequest,
        requests: serializedRequests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAmbulanceRequest = async (req, res) => {
  try {
    const payload = normalizeRequestPayload(req.body);
    const authenticatedPatientId = req.userId || null;

    if (authenticatedPatientId && !payload.patientId) {
      payload.patientId = authenticatedPatientId;
    }

    if (req.user?.username && !payload.patientName) {
      payload.patientName = req.user.username;
    }

    if (req.user?.phone && !payload.patientPhone) {
      payload.patientPhone = req.user.phone;
      payload.patientPhoneNormalized = normalizePhoneDigits(req.user.phone);
    }

    const linkedPatientUserId = authenticatedPatientId || await findMatchingPatientUserId({
      patientUserId: payload.patientUser,
      patientId: payload.patientId,
      patientPhone: payload.patientPhoneNormalized || payload.patientPhone,
    });

    if (linkedPatientUserId) {
      payload.patientUser = linkedPatientUserId;
    } else {
      delete payload.patientUser;
    }

    if (!payload.patientId || !payload.pickupLocation.address || !payload.destination.address) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID, pickup address, and destination are required.',
      });
    }

    let requestRecord;
    if (!isDbConnected()) {
      requestRecord = createFallbackRequest(payload);
    } else {
      requestRecord = await AmbulanceRequest.create(payload);
      requestRecord = await AmbulanceRequest.findById(requestRecord._id).populate('assignedAmbulance');
    }

    const responsePayload = withSerializedRequest(req, requestRecord);
    const io = getSocketServer();
    io?.emit('ambulance:request-created', { request: responsePayload });
    emitDashboardRefresh(io);

    res.status(201).json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const assignAmbulanceToRequest = async (req, res) => {
  try {
    const requestRecord = await getRequestByIdFromSource(req.params.requestId);
    if (!requestRecord) {
      return res.status(404).json({ success: false, error: 'Booking request not found.' });
    }

    const ambulance = await getAmbulanceByIdFromSource(req.body.ambulanceId);
    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Selected ambulance not found.' });
    }

    if (ambulance.currentStatus !== 'Available') {
      return res.status(409).json({
        success: false,
        error: 'This ambulance is no longer available for assignment.',
      });
    }

    const etaContext = calculateEtaContext(ambulance, requestRecord);
    const assignedDriver = sanitizeText(req.body.assignedDriver) || ambulance.driverName;
    const billing = getBillingBreakdown(requestRecord, ambulance, etaContext.distanceKm);

    let updatedAmbulance;
    let updatedRequest;

    if (!isDbConnected()) {
      updatedAmbulance = updateFallbackAmbulance(ambulance._id, { currentStatus: 'Busy' });
      updatedRequest = updateFallbackRequest(req.params.requestId, {
        assignedAmbulance: ambulance._id,
        assignedDriver,
        requestStatus: 'Assigned',
        etaMinutes: etaContext.etaMinutes,
        patientDistanceKm: etaContext.distanceKm,
        billing,
      });
      updatedRequest = {
        ...updatedRequest,
        assignedAmbulance: updatedAmbulance,
      };
    } else {
      updatedAmbulance = await Ambulance.findOneAndUpdate(
        { _id: ambulance._id, currentStatus: 'Available' },
        { currentStatus: 'Busy' },
        { returnDocument: 'after', runValidators: true },
      );

      if (!updatedAmbulance) {
        return res.status(409).json({
          success: false,
          error: 'This ambulance was assigned by another dispatcher. Please choose a different one.',
        });
      }

      await AmbulanceRequest.findByIdAndUpdate(
        req.params.requestId,
        {
          assignedAmbulance: updatedAmbulance._id,
          assignedDriver,
          requestStatus: 'Assigned',
          etaMinutes: etaContext.etaMinutes,
          patientDistanceKm: etaContext.distanceKm,
          billing,
        },
        { runValidators: true },
      );

      updatedRequest = await AmbulanceRequest.findById(req.params.requestId).populate('assignedAmbulance');
    }

    const responsePayload = withSerializedRequest(req, updatedRequest);
    const io = getSocketServer();
    emitDriverAssignment(io, updatedAmbulance, { request: responsePayload });
    emitTrackingUpdate(io, responsePayload);
    emitDashboardRefresh(io);

    res.status(200).json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateAmbulanceRequestStatus = async (req, res) => {
  try {
    const requestRecord = await getRequestByIdFromSource(req.params.requestId);
    if (!requestRecord) {
      return res.status(404).json({ success: false, error: 'Booking request not found.' });
    }

    const requestedStatus = req.body.requestStatus || req.body.status;
    const normalizedStatus = requestedStatus?.toLowerCase() === 'trip end'
      ? 'Completed'
      : normalizeChoice(requestedStatus, REQUEST_STATUSES, null);

    if (!normalizedStatus) {
      return res.status(400).json({ success: false, error: 'Invalid request status provided.' });
    }

    const logs = {
      tripStartTime: req.body.logs?.tripStartTime
        ? new Date(req.body.logs.tripStartTime)
        : requestRecord.logs?.tripStartTime || null,
      tripEndTime: req.body.logs?.tripEndTime
        ? new Date(req.body.logs.tripEndTime)
        : requestRecord.logs?.tripEndTime || null,
      fuelLitres: toNumber(req.body.logs?.fuelLitres) ?? requestRecord.logs?.fuelLitres ?? null,
      distanceKm: toNumber(req.body.logs?.distanceKm) ?? requestRecord.logs?.distanceKm ?? null,
    };

    if (normalizedStatus === 'Picked up' && !logs.tripStartTime) {
      logs.tripStartTime = new Date();
    }

    if ((normalizedStatus === 'Dropped' || normalizedStatus === 'Completed') && !logs.tripEndTime) {
      logs.tripEndTime = new Date();
    }

    const releaseAmbulance = normalizedStatus === 'Completed' || normalizedStatus === 'Cancelled';
    const ambulanceId = requestRecord.assignedAmbulance?._id || requestRecord.assignedAmbulance || null;
    let updatedAmbulance = requestRecord.assignedAmbulance || null;
    let requestBilling = requestRecord.billing || {};

    if (releaseAmbulance && updatedAmbulance) {
      requestBilling = {
        ...getBillingBreakdown(requestRecord, updatedAmbulance, logs.distanceKm),
        finalAmount: getBillingBreakdown(requestRecord, updatedAmbulance, logs.distanceKm).estimatedAmount,
        addedToMainBill: true,
      };
    }

    let updatedRequest;

    if (!isDbConnected()) {
      if (ambulanceId && (releaseAmbulance || req.body.currentKm || req.body.shiftStatus)) {
        const ambulancePatch = {};
        if (releaseAmbulance) ambulancePatch.currentStatus = 'Available';
        if (req.body.shiftStatus) {
          ambulancePatch.shiftStatus = normalizeChoice(req.body.shiftStatus, SHIFT_STATUSES, undefined);
        }
        if (req.body.currentKm) {
          ambulancePatch.maintenance = {
            currentKm: toNumber(req.body.currentKm),
          };
        }

        updatedAmbulance = updateFallbackAmbulance(ambulanceId, ambulancePatch);
      }

      updatedRequest = updateFallbackRequest(req.params.requestId, {
        requestStatus: normalizedStatus,
        etaMinutes: normalizedStatus === 'Completed' ? 0 : requestRecord.etaMinutes,
        logs,
        billing: requestBilling,
      });

      updatedRequest = {
        ...updatedRequest,
        assignedAmbulance: updatedAmbulance,
      };
    } else {
      if (ambulanceId && (releaseAmbulance || req.body.currentKm || req.body.shiftStatus)) {
        const ambulancePatch = {};
        if (releaseAmbulance) ambulancePatch.currentStatus = 'Available';
        if (req.body.shiftStatus) {
          ambulancePatch.shiftStatus = normalizeChoice(req.body.shiftStatus, SHIFT_STATUSES, undefined);
        }
        if (req.body.currentKm) {
          ambulancePatch.maintenance = {
            ...(requestRecord.assignedAmbulance?.maintenance || {}),
            currentKm: toNumber(req.body.currentKm),
          };
        }

        updatedAmbulance = await Ambulance.findByIdAndUpdate(ambulanceId, ambulancePatch, {
          returnDocument: 'after',
          runValidators: true,
        });
      }

      await AmbulanceRequest.findByIdAndUpdate(
        req.params.requestId,
        {
          requestStatus: normalizedStatus,
          etaMinutes: normalizedStatus === 'Completed' ? 0 : requestRecord.etaMinutes,
          logs,
          billing: requestBilling,
        },
        { runValidators: true },
      );

      updatedRequest = await AmbulanceRequest.findById(req.params.requestId).populate('assignedAmbulance');
    }

    const responsePayload = withSerializedRequest(req, updatedRequest);
    const io = getSocketServer();
    emitTrackingUpdate(io, responsePayload);
    emitDashboardRefresh(io);

    res.status(200).json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAmbulanceTracking = async (req, res) => {
  try {
    let requestRecord;
    if (!isDbConnected()) {
      const request = getFallbackRequestByTrackingCode(req.params.trackingCode);
      requestRecord = request
        ? {
            ...request,
            assignedAmbulance: request.assignedAmbulance
              ? getFallbackAmbulanceById(request.assignedAmbulance)
              : null,
          }
        : null;
    } else {
      requestRecord = await AmbulanceRequest.findOne({
        trackingCode: req.params.trackingCode,
      }).populate('assignedAmbulance');
    }

    if (!requestRecord) {
      return res.status(404).json({ success: false, error: 'Tracking link not found.' });
    }

    res.status(200).json({
      success: true,
      data: withSerializedRequest(req, requestRecord),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
