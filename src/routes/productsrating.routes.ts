import { Router } from "express";
import productreviewController from "../controllers/productrating.controller.js";
import { authenticateJWT } from "../middleware/globalerrorhandler.js";

const router = Router();


// 📦 Create Reviews

router.post("/:productId",authenticateJWT, productreviewController.createreview);

// 📦 Get all reviews
router.get("/", productreviewController.getReviewsByProductId);

// 📦 Update review
router.put("/:reviewId", authenticateJWT, productreviewController.updateReview);

// 📦 Delete review
router.delete("/:reviewId", authenticateJWT, productreviewController.deleteReview);


export default router;

