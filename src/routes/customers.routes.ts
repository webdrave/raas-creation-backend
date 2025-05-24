import { Router } from 'express';
import customersController from '../controllers/customers.controller.js';
import { authenticateJWT, isAdmin } from '../middleware/globalerrorhandler.js';
const router = Router();


//fix routes
router.get("/allcustomers",authenticateJWT,isAdmin, customersController.allCustomers);

router.put("/customer/:id", authenticateJWT, customersController.updatecustomer);

router.get("/customer", authenticateJWT, customersController.getCustomer);

router.delete("/address/:addressId", authenticateJWT, customersController.deleteAddress);

router.put("/address/:addressId", authenticateJWT, customersController.updateAddress);

router.post("/address", authenticateJWT, customersController.addAddress);

router.get("/address", authenticateJWT, customersController.getAddress);

router.post("/otp", customersController.getOtpByNumber);

router.post(`/resend-otp`, customersController.getOtpByJwt);

router.post("/verify-otp", customersController.verfy_otp);

router.post("/verify-otp", customersController.verfy_otp);

router.post("/makeAdmin", authenticateJWT, isAdmin, customersController.makeAdmin);

router.post("/change-password", authenticateJWT, isAdmin, customersController.changePassword);

router.post("/reset-password", customersController.forgotPassword);

router.get("/byId/:id", authenticateJWT, customersController.getCustomerById);

router.get("/", authenticateJWT, customersController.getCustomer);

router.put("/", authenticateJWT, customersController.updatecustomer);

export default router;