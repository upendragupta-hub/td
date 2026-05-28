// // // import express from "express";
// // // import { createAppointment, getAppointments } from "../controllers/appointmentController.js";

// // // const router = express.Router();

// // // router.get("/", getAppointments);
// // // router.post("/", createAppointment);

// // // export default router;



// // import express from "express";
// // import { 
// //   createAppointment, 
// //   getAllAppointments, 
// //   updateAppointmentStatus,
// //   deleteAppointment,
// //   getAppointments 
// // } from "../controllers/appointmentController.js";

// // const router = express.Router();

// // router.get("/", getAppointments);
// // router.post("/", createAppointment);
// // router.get("/admin", getAllAppointments);
// // router.patch("/:id/status", updateAppointmentStatus);
// // router.delete("/:id", deleteAppointment);

// // export default router;




// import express from "express";
// import { 
//   createAppointment, 
//   getAllAppointments, 
//   updateAppointmentStatus,
//   deleteAppointment,
//   getAppointments 
// } from "../controllers/appointmentController.js";

// const router = express.Router();

// router.get("/", getAppointments);
// router.post("/", createAppointment);
// router.get("/admin", getAllAppointments);
// router.patch("/:id/status", updateAppointmentStatus);
// router.delete("/:id", deleteAppointment);

// export default router;





import express from "express";
import { 
  createAppointment, 
  getAllAppointments, 
  updateStatus,
  deleteAppointment,
  getAppointments,
  getUserAppointments
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectUser } from "../middleware/userAuthMiddleware.js";

const router = express.Router();

router.get("/", getAppointments);
router.post("/", protectUser, createAppointment);
router.get("/my-appointments", protectUser, getUserAppointments);
router.get("/admin", protect, getAllAppointments);
router.patch("/:id", protect, updateStatus);
router.delete("/:id", protect, deleteAppointment);

export default router;
