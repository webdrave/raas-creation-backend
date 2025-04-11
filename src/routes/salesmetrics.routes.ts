import { Router } from "express";

import  getAllTimeMetricsControllers  from "../controllers/salesMetrics.controller.js";

const router = Router();

router.get("/all-time", getAllTimeMetricsControllers.getAllTimeMetrics);
// 📦 Get sales metrics

export default router;