import { z } from "zod";
import { PURCHASE_STATUS_ENUM } from "./purchase.constants";

const purchaseItemSchema = z.object({
  variant: z.string({ required_error: "Variant ID is required" }),
  product: z.string({ required_error: "Product ID is required" }),
  qty: z.number({ required_error: "Quantity is required" }).min(1),
  unit_cost: z
    .number({ required_error: "Unit cost is required" })
    .nonnegative(),
  discount: z.number({ required_error: "Discount is required" }).min(0),
  tax: z.number().optional(),
  lot_number: z.string().optional(),
  expiry_date: z.coerce.date().optional(),
});

const expenseAppliedSchema = z.object({
  type: z.string({ required_error: "Expense type is required" }),
  amount: z
    .number({ required_error: "Expense amount is required" })
    .nonnegative(),
  note: z.string().optional(),
});

const createPurchaseSchema = z.object({
  body: z
    .object({
      business_location: z.string({
        required_error: "Business location is required",
      }),
      supplier: z.string({ required_error: "Supplier ID is required" }),
      purchase_date: z.coerce.date({
        required_error: "Purchase date is required",
      }),
      items: z
        .array(purchaseItemSchema, { required_error: "Items are required" })
        .min(1, "At least one item is required"),
      expenses_applied: z.array(expenseAppliedSchema).optional(),
      attachments: z.array(z.string().url()).optional(),
      status: z.enum(
        Object.values(PURCHASE_STATUS_ENUM) as [string, ...string[]]
      ),
      total_cost: z.number().optional(),
    })
    .strict(),
});

const updatePurchaseSchema = z.object({
  body: z
    .object({
      business_location: z.string({
        required_error: "Business location is required",
      }),
      supplier: z.string({ required_error: "Supplier ID is required" }),
      items: z
        .array(purchaseItemSchema, { required_error: "Items are required" })
        .min(1, "At least one item is required"),
      expenses_applied: z.array(expenseAppliedSchema).optional(),
      attachments: z.array(z.string().url()).optional(),
      status: z.enum(
        Object.values(PURCHASE_STATUS_ENUM) as [string, ...string[]]
      ),
      total_cost: z.number().optional(),
    })
    .strict(),
  params: z.object({
    id: z.string({ required_error: "Params ID is required" }),
  }),
});

const updateStatusPurchaseSchema = z.object({
  body: z
    .object({
      status: z.enum(
        Object.values(PURCHASE_STATUS_ENUM) as [string, ...string[]]
      ),
    })
    .strict(),
  params: z.object({
    id: z.string({ required_error: "Params ID is required" }),
  }),
});

const deletePurchaseSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Params ID is required" }),
  }),
});

export const PurchaseValidationSchema = {
  createPurchaseSchema,
  updatePurchaseSchema,
  updateStatusPurchaseSchema,
  deletePurchaseSchema,
};
