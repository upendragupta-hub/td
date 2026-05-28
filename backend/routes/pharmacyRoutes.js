import express from 'express';
import {
  getStock,
  addMedicine,
  updateMedicine,
  getExpiringSoon,
  getLowStock,
  getPendingPrescriptions,
  createPrescription,
  dispatchPrescription,
} from '../controllers/pharmacyController.js';

const router = express.Router();

router.route('/stock')
  .get(getStock)
  .post(addMedicine);

router.route('/stock/:id')
  .put(updateMedicine);

router.route('/stock/expiring-soon')
  .get(getExpiringSoon);

router.route('/stock/low')
  .get(getLowStock);

router.route('/prescriptions')
  .get(getPendingPrescriptions)
  .post(createPrescription);

router.route('/prescriptions/:id/dispatch')
  .post(dispatchPrescription);

export default router;