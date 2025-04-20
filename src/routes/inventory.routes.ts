import express from 'express';


const router = express.Router();

import inventaryController from '../controllers/inventory.controller.js';
import { authenticateJWT, isAdmin } from '../middleware/globalerrorhandler.js';

router.get('/overview',authenticateJWT,isAdmin, inventaryController.getOverview);
router.get('/all',authenticateJWT,isAdmin, inventaryController.getInventory);

export default router;