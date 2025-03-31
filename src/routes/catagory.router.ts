import { Router } from 'express';
import categoryController from "../controllers/catagory.controller.js";

const router = Router();

router.get("/",categoryController.getAllCategories);

router.post("/", categoryController.addCategory);

router.get("/:id", categoryController.getCategory);

router.put("/:id", categoryController.updateCategory);

router.delete("/:id", categoryController.deleteCategory);




export default router;