import { z } from "zod";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";

/**
 * Notes:
 * - Assumes productBarcodeStatus and productBarcodeCondition are TS enums (runtime objects).
 *   If they are string literal unions (type-only), replace z.nativeEnum(...) with z.enum([...]).
 * - We validate Mongo ObjectId as a 24-hex string. If you accept other id shapes, adjust idRegex.
 */

const idRegex = /^[0-9a-fA-F]{24}$/;

// Basic ObjectId validator (string matching 24 hex chars)
const ObjectIdString = z.string().regex(idRegex, "Invalid ObjectId string");

// updateBy schema
export const UpdateBySchema = z.object({
  name: z.string().min(1),
  // store role as string here; you can tighten this with a runtime enum of IRoles if available
  role: z.string().min(1),
  reason: z.string().nullable().optional(),
  status_change_notes: z.string().nullable().optional(),
  date: z.preprocess((arg) => {
    // allow Date or ISO string
    if (typeof arg === "string" || arg instanceof Date)
      return new Date(arg as any);
    return arg;
  }, z.instanceof(Date)),
});

// barcode schema
export const BarcodeSchema = z.object({
  barcode: z.string().min(1),
  sku: z.string().min(1),

  // Accept ObjectId strings for references. If you sometimes pass plain names/strings,
  // replace ObjectIdString with z.string().min(1)
  variant: ObjectIdString,
  product: ObjectIdString,
  lot: z.union([ObjectIdString, z.null()]).optional().nullable(),
  stock: z.union([ObjectIdString, z.null()]).optional().nullable(),

  // Using runtime enums (TS enum). This validates a single enum value.
  status: z.nativeEnum(productBarcodeStatus),

  // if you expect an array of conditions, change to z.array(z.nativeEnum(...))
  conditions: z.nativeEnum(productBarcodeCondition).optional().nullable(),

  is_used_barcode: z.boolean().optional().default(false),

  updated_by: z.array(UpdateBySchema).optional().default([]),

  // timestamps (createdAt/updatedAt) — optional, accept Date or ISO string
  createdAt: z
    .preprocess(
      (arg) => (arg ? new Date(arg as any) : arg),
      z.instanceof(Date).optional()
    )
    .optional(),
  updatedAt: z
    .preprocess(
      (arg) => (arg ? new Date(arg as any) : arg),
      z.instanceof(Date).optional()
    )
    .optional(),
});

// Export inferred TS types if desired
export type UpdateBy = z.infer<typeof UpdateBySchema>;
export type BarcodeInput = z.infer<typeof BarcodeSchema>;

// Helper validate function
export function validateBarcode(input: unknown) {
  return BarcodeSchema.safeParse(input);
}
