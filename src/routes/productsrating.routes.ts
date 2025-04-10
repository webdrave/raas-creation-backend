import { Router } from "express";
import productreviewController from "../controllers/productrating.controller.js";

const router = Router();


// 📦 Create testimonial

router.post("/:productId", productreviewController.createreview);

// 📦 Get all testimonial by product id
router.get("/:productId", productreviewController.getReviewsByProductId);


export default router;

