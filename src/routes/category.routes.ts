import { Router } from 'express';
import categoryController from "../controllers/category.controller.js";
import { authenticateJWT,isAdmin } from '../middleware/globalerrorhandler.js';

const router = Router();

router.get("/detail",categoryController.getCategoryDetails);

router.get("/",categoryController.getAllCategories);

router.post("/", authenticateJWT,isAdmin,categoryController.addCategory);

router.get("/:id", categoryController.getCategory);

router.put("/:id",authenticateJWT,isAdmin, categoryController.updateCategory);

router.delete("/:id",authenticateJWT,isAdmin, categoryController.deleteCategory);




export default router;