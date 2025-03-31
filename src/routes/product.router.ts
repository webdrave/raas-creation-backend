import {Router} from 'express';

import ProductController from '../controllers/product.controller.js';

const router = Router();

router.post('/', ProductController.addProduct);
router.get("/", ProductController.getAllProduct);
router.get("/:id", ProductController.getProduct);

router.post("/sizes", ProductController.addSizes);
router.put("/stock", ProductController.updateStock);
router.delete("/:id", ProductController.deleteProduct);

export default router;