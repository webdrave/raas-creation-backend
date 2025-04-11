import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/top-products', AnalyticsController.getTopProducts);

router.get('/best-sellers', AnalyticsController.getBesSellers);

router.get('/new-arrivals', AnalyticsController.newArrivals);

export default router;