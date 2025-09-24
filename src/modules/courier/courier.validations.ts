import { z } from "zod";
import { MARCHANT } from "./courier.interface";
import { ORDER_STATUS } from "../order/order.enums";

// Create (POST) Zod Schema
export const createCourierZodSchema = z.object({
  marchant: z.enum([...(Object.values(MARCHANT) as [string, ...string[]])]),
  tracking_url: z.string().trim().optional().nullable(),
  tracking_id: z.string().trim().optional().nullable(),
  status: z
    .enum([...(Object.values(ORDER_STATUS) as [string, ...string[]])])
    .optional(),
  Order: z.string().min(1, "Order is required"), // MongoDB ObjectId as string
  Delivery_man: z.string().trim().optional().nullable(),
  Delivery_man_phone: z.string().trim().optional().nullable(),
  COD_Amount: z.number().optional(),
  Courier_Note: z.string().trim().optional().nullable(),
  Consignment_ID: z.string().trim().optional().nullable(),
  Transfer_to_Courier: z.boolean().optional(),
  Booking_Date: z.coerce.date(),
  Estrimated_Delivery_Date: z.coerce.date().optional().nullable(),
});

// Update (PATCH) Zod Schema
export const updateCourierZodSchema = z.object({
  marchant: z
    .enum([...(Object.values(MARCHANT) as [string, ...string[]])])
    .optional(),
  tracking_url: z.string().trim().optional().nullable(),
  tracking_id: z.string().trim().optional().nullable(),
  status: z
    .enum([...(Object.values(ORDER_STATUS) as [string, ...string[]])])
    .optional(),
  Order: z.string().optional(), // Usually not updatable, but added for flexibility
  Delivery_man: z.string().trim().optional().nullable(),
  Delivery_man_phone: z.string().trim().optional().nullable(),
  COD_Amount: z.number().optional(),
  Courier_Note: z.string().trim().optional().nullable(),
  Consignment_ID: z.string().trim().optional().nullable(),
  Transfer_to_Courier: z.boolean().optional(),
  Booking_Date: z.coerce.date().optional(),
  Estrimated_Delivery_Date: z.coerce.date().optional().nullable(),
});
