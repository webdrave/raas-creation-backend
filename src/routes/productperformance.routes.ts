import {Router} from 'express';

import productPerformanceController from '../controllers/productperformance.controller.js';

const router = Router();

router.get('/', productPerformanceController.getPerformance);

export default router;
