import express from 'express';
import {
  assignAmbulanceToRequest,
  createAmbulanceRecord,
  createAmbulanceRequest,
  getAmbulanceDashboard,
  getAmbulanceFleet,
  getMyAmbulanceRequests,
  getAmbulanceRequests,
  getAmbulanceTracking,
  submitMaintenanceReport,
  updateAmbulanceLocation,
  updateAmbulanceRecord,
  updateAmbulanceRequestStatus,
} from '../controllers/ambulanceController.js';
import { protectUser } from '../middleware/userAuthMiddleware.js';

const router = express.Router();

router.get('/dashboard', getAmbulanceDashboard);
router.get('/my-requests', protectUser, getMyAmbulanceRequests);
router.get('/track/:trackingCode', getAmbulanceTracking);

router.route('/fleet')
  .get(getAmbulanceFleet)
  .post(createAmbulanceRecord);

router.patch('/fleet/:ambulanceId', updateAmbulanceRecord);
router.patch('/fleet/:ambulanceId/location', updateAmbulanceLocation);
router.post('/fleet/:ambulanceId/maintenance-report', submitMaintenanceReport);

router.route('/requests')
  .get(getAmbulanceRequests)
  .post(createAmbulanceRequest);

router.post('/requests/:requestId/assign', assignAmbulanceToRequest);
router.patch('/requests/:requestId/status', updateAmbulanceRequestStatus);

export default router;
