import express from 'express';
import { getBeds, createBed, updateBed, deleteBed, updateBedStatus } from '../controllers/bedController.js';

const router = express.Router();

router.route('/')
  .get(getBeds)
  .post(createBed);

router.route('/:id') // General update/delete for bed details
  .put(updateBed)
  .delete(deleteBed);

router.patch('/:id/status', updateBedStatus); // Specific endpoint for status updates

export default router;
