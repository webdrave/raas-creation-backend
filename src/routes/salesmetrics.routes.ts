import { Router } from "express";

import  getAllTimeMetricsControllers  from "../controllers/salesMetrics.controller.js";
import { authenticateJWT, isAdmin } from "../middleware/globalerrorhandler.js";

const router = Router();

router.get("/all-time",authenticateJWT,isAdmin, getAllTimeMetricsControllers.getAllTimeMetrics);

// Get sales overwview
router.get("/overview",authenticateJWT,isAdmin, getAllTimeMetricsControllers.getSalesOverview);

router.get("/graph",authenticateJWT,isAdmin, getAllTimeMetricsControllers.getGraphData);

export default router;