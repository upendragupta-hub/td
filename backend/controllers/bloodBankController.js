import BloodBank from '../models/BloodBank.js';
import EmergencyBloodRequest from '../models/EmergencyBloodRequest.js';
import { sendBloodEmergencyAlert } from '../utils/paymentNotifications.js';
import { sendStatusUpdateEmail } from '../utils/emailService.js';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

async function ensureBloodBankSeeded() {
  const count = await BloodBank.countDocuments();
  if (count === 0) {
    const createOps = BLOOD_GROUPS.map((bloodGroup) => ({
      bloodGroup,
      units: 0,
      criticalLevel: 5,
    }));
    await BloodBank.insertMany(createOps);
  }
}

// Initialize blood bank with all blood groups
export const initializeBloodBank = async (req, res) => {
  try {
    for (const group of BLOOD_GROUPS) {
      const exists = await BloodBank.findOne({ bloodGroup: group });
      if (!exists) {
        await BloodBank.create({
          bloodGroup: group,
          units: 0,
          criticalLevel: 5,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Blood bank initialized with all blood groups',
    });
  } catch (error) {
    console.error('Blood bank initialization error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all blood bank inventory
export const getBloodInventory = async (req, res) => {
  try {
    await ensureBloodBankSeeded();
    const inventory = await BloodBank.find().sort({ bloodGroup: 1 });
    
    const stats = {
      totalUnits: 0,
      criticalGroups: [],
      fullInventory: inventory,
    };

    inventory.forEach((item) => {
      stats.totalUnits += item.units;
      if (item.units <= item.criticalLevel) {
        stats.criticalGroups.push({
          bloodGroup: item.bloodGroup,
          units: item.units,
          criticalLevel: item.criticalLevel,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        inventory: stats.fullInventory,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching blood inventory:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single blood group inventory
export const getBloodGroupInventory = async (req, res) => {
  try {
    await ensureBloodBankSeeded();
    const { bloodGroup } = req.params;

    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ success: false, error: 'Invalid blood group' });
    }

    const blood = await BloodBank.findOne({ bloodGroup });
    if (!blood) {
      return res.status(404).json({ success: false, error: 'Blood group not found' });
    }

    res.status(200).json({ success: true, data: blood });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add blood donation (increase stock)
export const addBloodDonation = async (req, res) => {
  try {
    const { bloodGroup, units, donorName, donorEmail, donorPhone } = req.body;

    if (!bloodGroup || !units || units <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Blood group and units are required',
      });
    }

    const blood = await BloodBank.findOne({ bloodGroup });
    if (!blood) {
      return res.status(404).json({ success: false, error: 'Blood group not found' });
    }

    const previousUnits = blood.units;
    blood.units += parseInt(units);
    blood.donorCount += 1;
    await blood.save();

    console.log(
      `✅ Blood donation recorded: ${donorName || 'Anonymous'} - ${bloodGroup} (${units} units)`
    );

    res.status(200).json({
      success: true,
      message: `${units} units of ${bloodGroup} blood added successfully`,
      data: {
        bloodGroup: blood.bloodGroup,
        previousUnits,
        currentUnits: blood.units,
        donorName: donorName || 'Anonymous',
      },
    });
  } catch (error) {
    console.error('Error adding blood donation:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Use blood (decrease stock)
export const useBlood = async (req, res) => {
  try {
    const { bloodGroup, units, patientName, department } = req.body;

    if (!bloodGroup || !units || units <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Blood group and units are required',
      });
    }

    const blood = await BloodBank.findOne({ bloodGroup });
    if (!blood) {
      return res.status(404).json({ success: false, error: 'Blood group not found' });
    }

    if (blood.units < units) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${blood.units} units`,
        availableUnits: blood.units,
      });
    }

    const previousUnits = blood.units;
    blood.units -= parseInt(units);
    await blood.save();

    console.log(
      `🩸 Blood used: ${patientName || 'Patient'} - ${bloodGroup} (${units} units)`
    );

    // Alert if stock becomes critical
    if (blood.units <= blood.criticalLevel) {
      console.warn(
        `⚠️  CRITICAL: ${bloodGroup} blood stock is LOW (${blood.units} units remaining)`
      );
    }

    res.status(200).json({
      success: true,
      message: `${units} units of ${bloodGroup} blood used successfully`,
      data: {
        bloodGroup: blood.bloodGroup,
        previousUnits,
        currentUnits: blood.units,
        isCritical: blood.units <= blood.criticalLevel,
      },
    });
  } catch (error) {
    console.error('Error using blood:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create emergency blood request
export const createEmergencyRequest = async (req, res) => {
  try {
    const {
      bloodGroup,
      units,
      patientName,
      patientEmail,
      patientAge,
      department,
      urgency,
      description,
    } = req.body;

    if (!bloodGroup || !units || !patientName || !patientEmail || !department) {
      return res.status(400).json({
        success: false,
        error: 'Blood group, units, patient name, and department are required',
      });
    }

    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ success: false, error: 'Invalid blood group' });
    }

    const request = new EmergencyBloodRequest({
      bloodGroup,
      units,
      patientName,
      patientEmail,
      patientAge,
      department,
      urgency: urgency || 'High',
      description,
      requestedBy: req.adminId || req.userId,
      status: 'Pending',
    });

    await request.save();

    // Check current stock
    const bloodStock = await BloodBank.findOne({ bloodGroup });
    const availableUnits = bloodStock?.units || 0;

    // Send emergency alert
    const alertResult = await sendBloodEmergencyAlert({
      bloodGroup,
      units,
      patientName,
      department,
      urgency,
      availableUnits,
    });

    console.log(`🚨 EMERGENCY: Blood needed - ${bloodGroup} (${units} units) for ${patientName}`);

    res.status(201).json({
      success: true,
      message: 'Emergency blood request created and alerts sent',
      data: {
        requestId: request._id,
        bloodGroup,
        units,
        patientName,
        urgency,
        availableUnits,
        alertStatus: alertResult,
      },
    });
  } catch (error) {
    console.error('Error creating emergency request:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all emergency requests
export const getEmergencyRequests = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : {};

    const requests = await EmergencyBloodRequest.find(filter)
      .populate('requestedBy', 'username email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching emergency requests:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update emergency request status
export const updateEmergencyRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const request = await EmergencyBloodRequest.findByIdAndUpdate(
      id,
      {
        status,
        notes,
        completedAt: status === 'Completed' ? Date.now() : null,
      },
      { new: true }
    ).populate('requestedBy', 'username');

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Notification logic
    if ((request.patientEmail || request.requestedBy?.email) && (status === 'Approved' || status === 'Cancelled')) {
      await sendStatusUpdateEmail(
        request.patientEmail || request.requestedBy.email,
        request.requestedBy.username,
        status,
        request.bloodGroup,
        request.units,
        notes
      );
    }

    res.status(200).json({
      success: true,
      message: 'Emergency request status updated',
      data: request,
    });
  } catch (error) {
    console.error('Error updating emergency request:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get blood statistics
export const getBloodStatistics = async (req, res) => {
  try {
    await ensureBloodBankSeeded();
    const inventory = await BloodBank.find();

    const stats = {
      totalUnits: 0,
      byBloodGroup: {},
      critical: [],
      adequate: [],
    };

    inventory.forEach((item) => {
      stats.totalUnits += item.units;
      stats.byBloodGroup[item.bloodGroup] = {
        units: item.units,
        donorCount: item.donorCount,
        isCritical: item.units <= item.criticalLevel,
      };

      if (item.units <= item.criticalLevel) {
        stats.critical.push(item.bloodGroup);
      } else {
        stats.adequate.push(item.bloodGroup);
      }
    });

    const emergencyRequestsCount = await EmergencyBloodRequest.countDocuments({
      status: 'Pending',
    });

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        pendingEmergencies: emergencyRequestsCount,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update critical level for blood group
export const updateCriticalLevel = async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const { criticalLevel } = req.body;

    if (criticalLevel < 0) {
      return res.status(400).json({
        success: false,
        error: 'Critical level must be a positive number',
      });
    }

    const blood = await BloodBank.findOneAndUpdate(
      { bloodGroup },
      { criticalLevel },
      { new: true }
    );

    if (!blood) {
      return res.status(404).json({ success: false, error: 'Blood group not found' });
    }

    res.status(200).json({
      success: true,
      message: `Critical level updated for ${bloodGroup}`,
      data: blood,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
