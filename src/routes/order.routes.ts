import { Router } from "express";
import orderController from "../controllers/order.controller.js";
import { authenticateJWT, isAdmin } from "../middleware/globalerrorhandler.js";

const router = Router();

// 🛒 Create a new order
router.post("/",authenticateJWT, orderController.createOrder);

router.get("/tax", orderController.getTax);

router.post("/tax", orderController.updateTax);

// 📦 Get all orders (Admin gets all, User gets only their orders)
router.get("/",authenticateJWT, orderController.getAllOrders);

// 📦 Get a single order by ID (Admin gets any order, User gets only their order)
router.get("/:id",authenticateJWT, orderController.getOrderById);

// 🔄 Update order status (Admin only)
router.patch("/:id/status",authenticateJWT,isAdmin, orderController.updateOrderStatus);

// 🚚 Update order fulfillment status (Admin only)
router.patch("/:id/fulfillment",authenticateJWT,isAdmin, orderController.updateFulfillment);

// ❌ Delete an order (Admin only)
router.delete("/:id",authenticateJWT,isAdmin, orderController.deleteOrder);



export default router;
