import express from 'express';

import { wishlistController } from '../controllers/wishlist.controller.js';
import { authenticateJWT } from '../middleware/globalerrorhandler.js';

const router = express.Router();
router.get('/products',authenticateJWT, wishlistController.getProductList);
router.get('/', authenticateJWT, wishlistController.getAll);
router.post('/', authenticateJWT, wishlistController.addToWishlist);
// router.put('/:id', wishlistController.update);
router.delete('/:productId', authenticateJWT, wishlistController.deletetoWishlist);

export default router;