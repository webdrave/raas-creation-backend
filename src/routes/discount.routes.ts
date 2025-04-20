import { Router } from 'express';

import discountController from '../controllers/discount.controller.js';
import { authenticateJWT, isAdmin } from '../middleware/globalerrorhandler.js';

const router = Router();

router.post('/',authenticateJWT,isAdmin, discountController.addDiscount);
router.get('/name/:name', discountController.getDiscountByName);
router.get('/:id', discountController.getDiscountById);
router.get('/',authenticateJWT, discountController.getAllDiscounts);
router.put('/:id',authenticateJWT,isAdmin, discountController.updateDiscount);
router.delete('/:id',authenticateJWT,isAdmin, discountController.deleteDiscount);

export default router;