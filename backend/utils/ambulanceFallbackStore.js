import { randomUUID } from 'node:crypto';

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeNested = (current, updates = {}) => ({
  ...current,
  ...updates,
  equipment: updates.equipment ? { ...(current.equipment || {}), ...updates.equipment } : current.equipment,
  maintenance: updates.maintenance ? { ...(current.maintenance || {}), ...updates.maintenance } : current.maintenance,
  maintenanceReports: updates.maintenanceReports ?? current.maintenanceReports,
  billing: updates.billing ? { ...(current.billing || {}), ...updates.billing } : current.billing,
  location: updates.location ? { ...(current.location || {}), ...updates.location } : current.location,
  logs: updates.logs ? { ...(current.logs || {}), ...updates.logs } : current.logs,
  pickupLocation: updates.pickupLocation
    ? { ...(current.pickupLocation || {}), ...updates.pickupLocation }
    : current.pickupLocation,
  destination: updates.destination ? { ...(current.destination || {}), ...updates.destination } : current.destination,
});

export function createAmbulanceSeedData() {
  const now = Date.now();

  return [
    {
      _id: randomUUID(),
      vehicleNumber: 'DL-1RT-2201',
      type: 'ICU',
      driverName: 'Rakesh Yadav',
      contact: '+91 9876543201',
      currentStatus: 'Available',
      shiftStatus: 'On Shift',
      location: {
        lat: 28.6139,
        lng: 77.209,
        address: 'Connaught Place, New Delhi',
        updatedAt: new Date(now - 4 * 60 * 1000),
      },
      equipment: {
        oxygenCylinder: true,
        defibrillator: true,
        ventilator: true,
        stretcher: true,
      },
      maintenance: {
        currentKm: 18240,
        serviceDueKm: 18500,
        lastServiceDate: new Date('2026-04-12T09:00:00.000Z'),
      },
      billing: {
        pricingModel: 'distance',
        perKmRate: 48,
        flatRate: 1800,
      },
      notes: 'Critical-care ambulance with ventilator support.',
    },
    {
      _id: randomUUID(),
      vehicleNumber: 'DL-1RT-2202',
      type: 'Oxygen-supported',
      driverName: 'Imran Khan',
      contact: '+91 9876543202',
      currentStatus: 'Busy',
      shiftStatus: 'On Shift',
      location: {
        lat: 28.5706,
        lng: 77.3272,
        address: 'Sector 18, Noida',
        updatedAt: new Date(now - 2 * 60 * 1000),
      },
      equipment: {
        oxygenCylinder: true,
        defibrillator: false,
        ventilator: false,
        stretcher: true,
      },
      maintenance: {
        currentKm: 14080,
        serviceDueKm: 16500,
        lastServiceDate: new Date('2026-03-20T09:00:00.000Z'),
      },
      billing: {
        pricingModel: 'distance',
        perKmRate: 42,
        flatRate: 1400,
      },
      notes: 'Ideal for oxygen-assisted intercity transport.',
    },
    {
      _id: randomUUID(),
      vehicleNumber: 'DL-1RT-2203',
      type: 'AC',
      driverName: 'Sunil Sharma',
      contact: '+91 9876543203',
      currentStatus: 'Available',
      shiftStatus: 'Off Shift',
      location: {
        lat: 28.5355,
        lng: 77.391,
        address: 'Noida Extension',
        updatedAt: new Date(now - 15 * 60 * 1000),
      },
      equipment: {
        oxygenCylinder: true,
        defibrillator: false,
        ventilator: false,
        stretcher: true,
      },
      maintenance: {
        currentKm: 9610,
        serviceDueKm: 13200,
        lastServiceDate: new Date('2026-04-03T09:00:00.000Z'),
      },
      billing: {
        pricingModel: 'flat',
        perKmRate: 38,
        flatRate: 1250,
      },
      notes: 'Comfort ambulance for non-critical city runs.',
    },
    {
      _id: randomUUID(),
      vehicleNumber: 'DL-1RT-2204',
      type: 'Non-AC',
      driverName: 'Mahesh Kumar',
      contact: '+91 9876543204',
      currentStatus: 'Maintenance',
      shiftStatus: 'Off Shift',
      location: {
        lat: 28.4595,
        lng: 77.0266,
        address: 'Workshop Bay, Gurgaon',
        updatedAt: new Date(now - 45 * 60 * 1000),
      },
      equipment: {
        oxygenCylinder: false,
        defibrillator: false,
        ventilator: false,
        stretcher: true,
      },
      maintenance: {
        currentKm: 22520,
        serviceDueKm: 22300,
        lastServiceDate: new Date('2026-01-20T09:00:00.000Z'),
      },
      maintenanceReports: [
        {
          _id: randomUUID(),
          issueTitle: 'Rear suspension noise',
          description: 'Driver reported strong vibration and metallic noise near the rear suspension during the last out-station trip.',
          priority: 'High',
          currentKm: 22520,
          locationAddress: 'Workshop Bay, Gurgaon',
          reportedBy: 'Mahesh Kumar',
          reportedContact: '+91 9876543204',
          reportedAt: new Date(now - 8 * 60 * 60 * 1000),
          status: 'New',
        },
      ],
      billing: {
        pricingModel: 'flat',
        perKmRate: 34,
        flatRate: 950,
      },
      notes: 'Under scheduled maintenance after long-haul duty.',
    },
  ];
}

export function createAmbulanceRequestSeedData(ambulances) {
  const now = Date.now();
  const assignedUnit = ambulances[1];

  return [
    {
      _id: randomUUID(),
      trackingCode: 'TRK-1102',
      patientId: 'PAT-1024',
      patientName: 'Sonia Kapoor',
      patientPhone: '+91 9811002200',
      pickupLocation: {
        address: 'Sector 18, Noida',
        lat: 28.5706,
        lng: 77.3272,
      },
      destination: {
        name: 'WeCare Hospital',
        address: 'MG Road, New Delhi',
        type: 'Hospital',
        lat: 28.5921,
        lng: 77.229,
      },
      urgencyLevel: 'Critical',
      assignedDriver: assignedUnit?.driverName,
      assignedAmbulance: assignedUnit?._id,
      requestStatus: 'Assigned',
      etaMinutes: 11,
      patientDistanceKm: 6.4,
      billing: {
        pricingModel: 'distance',
        estimatedAmount: 1680,
        finalAmount: null,
        addedToMainBill: false,
      },
      logs: {
        tripStartTime: null,
        tripEndTime: null,
        fuelLitres: null,
        distanceKm: null,
      },
      createdAt: new Date(now - 25 * 60 * 1000),
      updatedAt: new Date(now - 5 * 60 * 1000),
    },
    {
      _id: randomUUID(),
      trackingCode: 'TRK-1103',
      patientId: 'PAT-1036',
      patientName: 'Harsh Vardhan',
      patientPhone: '+91 9811002210',
      pickupLocation: {
        address: 'Rajouri Garden, Delhi',
        lat: 28.6516,
        lng: 77.1167,
      },
      destination: {
        name: 'City Trauma Centre',
        address: 'Karol Bagh, New Delhi',
        type: 'Hospital',
        lat: 28.6448,
        lng: 77.2167,
      },
      urgencyLevel: 'Moderate',
      assignedDriver: '',
      assignedAmbulance: null,
      requestStatus: 'Pending',
      etaMinutes: null,
      patientDistanceKm: null,
      billing: {
        pricingModel: 'flat',
        estimatedAmount: 1250,
        finalAmount: null,
        addedToMainBill: false,
      },
      logs: {
        tripStartTime: null,
        tripEndTime: null,
        fuelLitres: null,
        distanceKm: null,
      },
      createdAt: new Date(now - 10 * 60 * 1000),
      updatedAt: new Date(now - 10 * 60 * 1000),
    },
  ];
}

const fallbackAmbulances = createAmbulanceSeedData();
const fallbackRequests = createAmbulanceRequestSeedData(fallbackAmbulances);

export function getFallbackAmbulances() {
  return clone(fallbackAmbulances);
}

export function getFallbackRequests() {
  return clone(fallbackRequests);
}

export function getFallbackAmbulanceById(ambulanceId) {
  const ambulance = fallbackAmbulances.find((item) => item._id === ambulanceId);
  return ambulance ? clone(ambulance) : null;
}

export function getFallbackRequestById(requestId) {
  const request = fallbackRequests.find((item) => item._id === requestId);
  return request ? clone(request) : null;
}

export function getFallbackRequestByTrackingCode(trackingCode) {
  const request = fallbackRequests.find((item) => item.trackingCode === trackingCode);
  return request ? clone(request) : null;
}

export function createFallbackAmbulance(payload) {
  const ambulance = {
    _id: randomUUID(),
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  fallbackAmbulances.unshift(ambulance);
  return clone(ambulance);
}

export function updateFallbackAmbulance(ambulanceId, updates) {
  const index = fallbackAmbulances.findIndex((item) => item._id === ambulanceId);
  if (index === -1) return null;

  fallbackAmbulances[index] = mergeNested(fallbackAmbulances[index], {
    ...updates,
    updatedAt: new Date(),
  });

  return clone(fallbackAmbulances[index]);
}

export function createFallbackRequest(payload) {
  const request = {
    _id: randomUUID(),
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  fallbackRequests.unshift(request);
  return clone(request);
}

export function updateFallbackRequest(requestId, updates) {
  const index = fallbackRequests.findIndex((item) => item._id === requestId);
  if (index === -1) return null;

  fallbackRequests[index] = mergeNested(fallbackRequests[index], {
    ...updates,
    updatedAt: new Date(),
  });

  return clone(fallbackRequests[index]);
}
