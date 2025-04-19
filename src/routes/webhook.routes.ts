import { Router, Request, Response, NextFunction,raw } from "express";
import { orderDeliverd, orderOutforDelivery, orderShipped } from "../utils/whatsappclient.js";
import crypto from "crypto";

const WebhookRouter = Router();

// Secret for HMAC verification
const SHARED_SECRET = process.env.WEBHOOK_SECRET || " ";

// Helper: safely compare hashes
function verifySignature(rawBody: Buffer, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", SHARED_SECRET);
  hmac.update(rawBody);  // Ensure raw body is passed as Buffer
  const calculatedSignature = hmac.digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature));
  } catch (err) {
    console.error("❌ Error comparing signatures:", err);
    return false;
  }
}

// Webhook handler with raw body parsing
WebhookRouter.post("/", raw({ type: "application/json" }), async (req: Request, res: Response, next: NextFunction) => {
  const signature = req.header("X-Hmac-SHA256");

  if (!signature) {
    console.warn("Missing signature");
    res.status(400).send("Missing signature");
    return;
  }

  // `req.body` is a Buffer because of express.raw() middleware
  const rawBody = req.body as Buffer;

  if (!verifySignature(rawBody, signature)) {
    console.warn("Invalid signature");
    res.status(403).send("Invalid signature");
    return;
  }

  console.log("✅ Webhook verified");

  try {
    // Convert rawBody to string and parse JSON
    const bodyText = rawBody.toString("utf8");
    const payload = JSON.parse(bodyText);

    console.log("📦 Payload:", payload);

    // Example: handle different webhook event types based on the payload
    // You can call different functions like `orderShipped(payload)` based on the event type

    res.status(200).send("Webhook received and processed");
  } catch (err) {
    console.error("❌ Error processing webhook:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Prisma error handling middleware (for Prisma-related errors)
// WebhookRouter.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   if (err instanceof prisma.PrismaClientKnownRequestError) {
//     console.error("Prisma error:", err.message);
//     res.status(400).send("Prisma error occurred");
//   } else {
//     next(err);
//   }
// });


export default WebhookRouter;

// try {
//   const { order_id, awb, etd, current_status } = req.body;

//   if (!order_id) {
//     res.status(400).json({ success: false, message: "Missing order_id" });
//     return;
//   }

//   const order = await prisma.order.findUnique({
//     where: { id: order_id },
//     include: { user: true, items: true },
//   });

//   if (!order) {
//     res.status(404).json({ success: false, message: "Order not found" });
//     return;
//   }

//   let updateData: Record<string, any> = {};

//   if (!order.awb && awb) updateData.awb = awb;
//   if (!order.etd || order.etd !== etd) updateData.etd = etd;

//   if (order.DeliveryStatus !== current_status) {
//     switch (current_status.toUpperCase()) {
//       case "DELIVERED":
//         updateData.status = "COMPLETED";
//         updateData.deliveredAt = new Date();
//         orderDeliverd(order.user?.name ?? "Customer", order.items[0]?.productName ?? "your order", "Thank You", order.user?.mobile_no ?? "");
//         break;
//       case "CANCELED":
//         updateData.status = "CANCELLED";
//         updateData.deliveredAt = new Date();
//         break;
//       case "OUT FOR DELIVERY":
//         orderOutforDelivery(order.user?.name ?? "Customer", order.items[0]?.productName ?? "your order", "Thank You", "", order.user?.mobile_no ?? "");
//         break;
//       case "SHIPPED":
//         updateData.status = "PENDING";
//         orderShipped(order.user?.name ?? "Customer", order.items[0]?.productName ?? "your order", "Thank You", "", order.user?.mobile_no ?? "");
//         break;
//     }
//   }

//   updateData.DeliveryStatus = current_status;

//   await prisma.order.update({
//     where: { id: order_id },
//     data: updateData,
//   });

//   res.status(200).json({ success: true });
// } catch (error) {
//   console.error("Error processing webhook:", error);
//   res.status(500).json({ success: false, message: "Internal Server Error" });
// }