import { Router } from 'express';
import productController from "../controllers/product.controller.js";
import { authenticateJWT, isAdmin } from '../middleware/globalerrorhandler.js';

const router = Router();

// Create a new product
router.post("/",authenticateJWT,isAdmin, productController.addProduct);

// Add a color to an existing product
router.post("/color",authenticateJWT,isAdmin, productController.addColor);

// Update a color
router.put("/color/:id",authenticateJWT,isAdmin, productController.updateColor);

// Add sizes & stock to a product color
router.post("/sizes",authenticateJWT,isAdmin, productController.addSizes);

// Update stock for a specific product variant (size)
router.put("/stock",authenticateJWT,isAdmin, productController.updateStock);

// Update product status
router.put("/status/:id",authenticateJWT,isAdmin, productController.updateStatus);

// Update product details
router.put("/:id",authenticateJWT,isAdmin, productController.updateProduct);

// Delete a product
router.delete("/:id",authenticateJWT,isAdmin, productController.deleteProduct);

// Delete a product color
router.delete("/color/:id",authenticateJWT,isAdmin, productController.deleteColor);

// Delete a product variant (size)
router.delete("/variant/:id",authenticateJWT,isAdmin, productController.deleteVariant);

// Delete an image
router.delete("/asset/:id",authenticateJWT,isAdmin, productController.deleteAsset);

router.get("/colors", productController.getColors);

router.get("/overview",authenticateJWT,isAdmin, productController.getOverview);

// Get product details by ID
router.get("/:id", productController.getProduct);

// Get all products
router.get("/", productController.getAllProduct);

//Get a product by slug
router.get("/slug/:slug", productController.getSlugProduct)


export default router;