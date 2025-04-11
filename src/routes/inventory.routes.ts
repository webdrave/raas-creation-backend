import express from 'express';


const router = express.Router();

import inventaryController from '../controllers/inventory.controller.js';

router.get('/overview', inventaryController.getOverview);
router.get('/all', inventaryController.getInventory);

export default router;