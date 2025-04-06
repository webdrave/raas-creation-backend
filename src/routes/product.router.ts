import {Router} from 'express';

import ProductController from '../controllers/product.controller.js';

const router = Router();

router.post('/', ProductController.addProduct);
router.get("/", ProductController.getAllProduct);
router.get("/:id", ProductController.getProduct);
router.put("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);

router.post("/variant", ProductController.productVariant);
router.put("/variant/:variantId", ProductController.updateProductVariant);
// router.post("/sizes", ProductController.addSizes);

export default router;