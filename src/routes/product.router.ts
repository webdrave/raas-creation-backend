import {Router} from 'express';

import ProductController from '../controllers/product.controller.js';

const router = Router();

router.post('/', ProductController.addProduct);
router.get("/", ProductController.getAllProduct);
router.get("/:id", ProductController.getProduct);

router.post("/sizes", ProductController.addSizes);
router.put("/stock", ProductController.updateStock);
router.delete("/:id", ProductController.deleteProduct);
router.put("/:id", ProductController.updateProduct);
router.post("/:id/variants", ProductController.addVerient);
router.delete("/:id/variants", ProductController.deleteVariant);
router.get("/verients", ProductController.getProductVerients);

router.get("/overview", ProductController.getOverview);

export default router;