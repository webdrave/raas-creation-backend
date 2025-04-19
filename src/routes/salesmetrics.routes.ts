import { Router } from "express";

import  getAllTimeMetricsControllers  from "../controllers/salesMetrics.controller.js";

const router = Router();

router.get("/all-time", getAllTimeMetricsControllers.getAllTimeMetrics);

// Get sales overwview
router.get("/overview", getAllTimeMetricsControllers.getSalesOverview);

router.get("/graph", getAllTimeMetricsControllers.getGraphData);

export default router;