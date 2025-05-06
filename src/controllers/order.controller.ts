import { PrismaClient, OrderStatus, OrderFulfillment } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError, ValidationErr } from "../common/routeerror.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updateFulfillmentSchema,
} from "../types/validations/order.js";

import { prisma } from "../utils/prismaclient.js";
import axios from "axios";
import FormData from "form-data";
import { orderProcessed } from "../utils/whatsappclient.js";


/** ✅ Create a new order */
const createOrder = async (req: Request, res: Response, next: NextFunction) => {

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { userId, items, total, addressId, paid, isDiscount, discount, discountCode, razorpayOrderId } = parsed.data;


  if (paid) {
    if (!razorpayOrderId) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Razorpay Order ID is required");
    }
    const response = await axios.get(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID || '',
        password: process.env.RAZORPAY_SECRET || ''
      }
    });
    if (response.data.status !== "paid") {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Order is not paid");
    }
  } const order = await prisma.order.create({
    data: {
      userId,
      total,
      addressId,
      status: OrderStatus.PENDING,
      paid: paid,
      fulfillment: OrderFulfillment.PENDING,
      IsDiscount: isDiscount ? true : false,
      discount: discount ?? 0,
      discountCode: discountCode ?? "",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
          color: item.color,
          productImage: item.productImage,
          productName: item.productName,
          size: item.size,
        })),
      },
    },
    include: { items: true },
  });

  // Create order in Nimbus Post
  const addressData = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!addressData) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Address not found");
  }
  console.log("Creating Nimbus Post order...");
  const formData = new FormData();

  console.log("Order ID:", order.id);
  console.log("Payment Method:", order.paid ? "prepaid" : "COD");
  console.log("Total Amount:", order.total);
  console.log("Address Data:", addressData);

  formData.append("order_number", order.id.toString());
  formData.append("payment_method", order.paid ? "prepaid" : "COD");
  formData.append("amount", order.total.toString());
  formData.append("fname", addressData.firstName);
  formData.append("lname", addressData.lastName ?? "");
  formData.append("address", addressData.aptNumber + " " + addressData.street);
  formData.append("phone", addressData.phoneNumber);
  formData.append("city", addressData.city);
  formData.append("state", addressData.state);
  formData.append("country", addressData.country);
  formData.append("pincode", addressData.zipCode);

  console.log("Form Data after adding address details:", formData);

  items.forEach((item, index) => {
    console.log(`Item ${index + 1}:`, item);
    formData.append(`products[${index}][name]`, item.productName + " " + item.size + " " + item.color);
    formData.append(`products[${index}][qty]`, item.quantity.toString());
    formData.append(`products[${index}][price]`, item.priceAtOrder.toString());
    formData.append(`products[${index}][sku]`, order.id.toString());
  });

  console.log("Complete Form Data:", formData);
  console.log("Nimbus API URL:", "https://ship.nimbuspost.com/api/orders/create");
  console.log("Nimbus Token:", process.env.NIMBUS_TOKEN);
  console.log("Form Headers:", formData.getHeaders());

  try {
    const data = await axios.post(
      "https://ship.nimbuspost.com/api/orders/create",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "NP-API-KEY": process.env.NIMBUS_TOKEN,
          "Content-Type": "multipart/form-data",
        }
      }
    );
    console.log("Nimbus API Response:", data);
    await prisma.order.update({
      where: { id: order.id },
      data: { NimbusPostOrderId: data.data.data }
    })
  } catch (error) {
    console.error("Nimbus Post API Error:", error.response?.data || error.message);
    console.error("Nimbus Post API Response:", error.response);
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Failed to create Nimbus Post order");
  }


  if (isDiscount) {
    await prisma.discount.update({
      where: { code: discountCode?.toUpperCase() },
      data: {
        usageCount: { increment: 1 }
      }
    })
  }

  const result = await prisma.productVariant.updateMany({
    where: { id: { in: items.map((item) => item.productVariantId) } },
    data: { stock: { decrement: 1 } },
  });

  // Send order to Whatsapp
  await orderProcessed(
    req.user?.name,
    req.user?.mobile_no,
    "# " + order.orderId,
    items.map((item) => item.productName).join(", "),
  );
  res.status(HttpStatusCodes.CREATED).json({ success: true, order });
};
/** ✅ Get all orders (Admin) */
const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;
  const skip = (page - 1) * limit;
  const search = req.query.search as string || "";

  // Build the where clause
  const whereClause: any = req.user.role === "ADMIN" ? {} : { userId: req.user.id };

  // Add search functionality if search term is provided
  if (search) {
    whereClause.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { userId: { contains: search, mode: 'insensitive' } },
      { orderId: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get orders with pagination
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      items: true // Include all OrderItem fields directly
    },
    take: limit,
    skip: skip,
    orderBy: { createdAt: 'desc' } // Most recent orders first
  });

  // No need for complex formatting since the OrderItem already contains all needed fields
  const formattedOrders = orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      id: item.productId,
      quantity: item.quantity,
      priceAtOrder: item.priceAtOrder,
      size: item.size,
      color: item.color,
      productVariantId: item.productVariantId,
      productName: item.productName,
      productImage: item.productImage,
    })),
  }));

  // Get total count for pagination
  const totalItems = await prisma.order.count({
    where: whereClause
  });

  const totalPages = Math.ceil(totalItems / limit);

  res.status(HttpStatusCodes.OK).json({
    success: true,
    orders: formattedOrders,
    pagination: {
      totalPages,
      currentPage: page,
      totalItems,
      itemsPerPage: limit
    }
  });
};

/** ✅ Get a single order by ID */
const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order ID");
  }

  const myOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true, address: true },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, order: myOrder });
};

/** ✅ Update order status */
const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {

  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order id");
  }

  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedOrder });
};

/** ✅ Update fulfillment status */
const updateFulfillment = async (req: Request, res: Response, next: NextFunction) => {

  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order id");
  }

  const parsed = updateFulfillmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { fulfillment: parsed.data.fulfillment },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedOrder });
};

/** ✅ Delete an order */
const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {

  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order id");
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Order not found");
  }

  await prisma.order.delete({ where: { id } });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Order deleted" });
};

const getTax = async (req: Request, res: Response, next: NextFunction) => {
  const tax = await prisma.extraData.findFirst();
  if (!tax) {
    res.status(HttpStatusCodes.OK).json({
      success: false, data: {
        GSTtax: null,
        ShiippingCharge: null,
        CodLimit: null,
      }
    });
    return;
  }
  res.status(HttpStatusCodes.OK).json({
    success: true, data: {
      GSTtax: tax.GSTtax,
      ShiippingCharge: tax.ShiippingCharge,
      CodLimit: tax.CodLimit
    }
  });
};
const updateTax = async (req: Request, res: Response, next: NextFunction) => {
  const { tax } = req.body;

  const { GSTtax, ShiippingCharge, CodLimit } = tax;

  const existingData = await prisma.extraData.findFirst();

  if (!existingData) {
    await prisma.extraData.create({
      data: {
        id: "1",
        GSTtax,
        ShiippingCharge,
        CodLimit,
      },
    });
  } else {
    await prisma.extraData.update({
      where: { id: "1" },
      data: {
        GSTtax,
        ShiippingCharge,
        CodLimit,
      },
    });
  }

  res.status(HttpStatusCodes.OK).json({ success: true, message: "Tax updated" });
};

const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order id");
  }
  const user = req.user;
  if (!user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const order = await prisma.order.findUnique({
    where: { id, userId: user.id },
  });

  if (!order) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Order not found");
  }
  if (order.fulfillment === "CANCELLED") {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Order already cancelled");
  }

  if (order.fulfillment === "DELIVERED") {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Order already fulfilled");
  }

  // cancel order from nimbus post

  const formData = new FormData();
  formData.append("id", order.NimbusPostOrderId);

  const data = await axios.post(
    "https://api.nimbuspost.com/api/v1/orders/cancel",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        "NP-API-KEY": process.env.NIMBUS_TOKEN,
      }
    }
  );

  if (data.status !== 200) {
    throw new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to cancel order");
  }


  await prisma.order.update({
    where: { id },
    data: {
      status: "CANCELLED",
      fulfillment: "CANCELLED",
    },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, message: "Order cancelled" });
};


export default {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateFulfillment,
  deleteOrder,
  getTax,
  updateTax,
  cancelOrder,
};
