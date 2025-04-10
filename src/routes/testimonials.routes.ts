import { Router } from "express";

import testimonialsController from "../controllers/testimonials.controller.js";

const router = Router();

router.post("/", testimonialsController.createTestimonial);
router.get("/", testimonialsController.getTestimonials);
router.put("/:id", testimonialsController.updateTestimonial);
router.delete("/:id", testimonialsController.deleteTestimonial);

export default router;