import { Router } from 'express';

import discountController from '../controllers/discount.controller.js';

const router = Router();

router.post('/', discountController.addDiscount);
router.get('/name/:name', discountController.getDiscountByName);
router.get('/:id', discountController.getDiscountById);
router.get('/', discountController.getAllDiscounts);
router.put('/:id', discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);

export default router;