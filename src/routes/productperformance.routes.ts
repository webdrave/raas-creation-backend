import {Router} from 'express';

import productPerformanceController from '../controllers/productperformance.controller.js';
import { authenticateJWT, isAdmin } from '../middleware/globalerrorhandler.js';

const router = Router();

router.get('/',authenticateJWT,isAdmin, productPerformanceController.getPerformance);

export default router;
