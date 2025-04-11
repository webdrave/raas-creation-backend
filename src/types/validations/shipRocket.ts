
import { z } from "zod";

export const ShipRocketOrderSchema = z.object({
  order_id: z.string(),
  order_date: z.string(),
  pickup_location: z.string(),
  billing_customer_name: z.string().nullable(),
  billing_address: z.string().nullable(),
  billing_city: z.string().nullable(),
  billing_pincode: z.string().nullable(),
  billing_state: z.string().nullable(),
  billing_country: z.string(),
  billing_email: z.string(),
  billing_phone: z.string().nullable(),
  order_items: z.array(
    z.object({
      name: z.string(),
      sku: z.string(),
      units: z.number(),
      selling_price: z.string(),
      hsn: z.string(),
    })
  ),
  payment_method: z.union([z.literal("COD"), z.literal("Prepaid")]),
  sub_total: z.number(),
  length: z.number(),
  breadth: z.number(),
  height: z.number(),
  weight: z.number(),
});

export type ShipRocketOrder = z.infer<typeof ShipRocketOrderSchema>;
