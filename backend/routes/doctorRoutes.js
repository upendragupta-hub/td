// backend/routes/doctorRoutes.js
import express from "express";
import { getDoctors, addDoctor, deleteDoctor, updateDoctor } from "../controllers/doctorController.js";

const router = express.Router();

router.get("/", getDoctors);
router.post("/", addDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;
