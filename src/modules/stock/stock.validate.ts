import { z } from "zod";

export const variantCombinationSchema = z.object({
  attribute_values: z.record(z.string().min(1, "Attribute value is required")),
  sale_price: z.number().min(0, "Sale Price cannot be negative"),
  regular_price: z.number().min(0, "regular Price cannot be negative"),
  sku: z.string().min(1, "SKU is required"),
  available_quantity: z
    .number()
    .min(0, "Available quantity cannot be negative"),
  image: z.string().url().optional(),
});

export const createInventorySchema = z.object({
  body: z.object({
    product: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
    outlet: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid outlet ID")
      .optional()
      .nullable(),
    warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid warehouse ID"),
    attributes: z
      .array(z.string().min(1, "Attribute name is required"))
      .optional(),
    variants: z
      .array(variantCombinationSchema)
      .optional()
      .refine(
        (variants) => {
          if (!variants || variants.length === 0) return true;
          const skus = variants.map((v) => v.sku);
          return new Set(skus).size === skus.length;
        },
        { message: "Variant SKUs must be unique" }
      ),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  cookies: z.object({}).optional(),
});

export const updateInventorySchema = z.object({
  body: z.object({
    product: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID")
      .optional(),
    outlet: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid outlet ID")
      .optional(),
    attributes: z
      .array(z.string().min(1, "Attribute name is required"))
      .optional(),
    variants: z
      .array(variantCombinationSchema)
      .optional()
      .refine(
        (variants) => {
          if (!variants || variants.length === 0) return true;
          const skus = variants.map((v) => v.sku);
          return new Set(skus).size === skus.length;
        },
        { message: "Variant SKUs must be unique" }
      ),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid inventory ID"),
  }),
  cookies: z.object({}).optional(),
});

export const getInventoriesSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    productId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID")
      .optional(),
    outletId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid outlet ID")
      .optional(),
  }),
  params: z.object({}).optional(),
  cookies: z.object({}).optional(),
});

export const getInventoryByIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid inventory ID"),
  }),
  cookies: z.object({}).optional(),
});

export const deleteInventorySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid inventory ID"),
  }),
  cookies: z.object({}).optional(),
});

export const InventoryValidationSchema = {
  createZodSchema: createInventorySchema,
  updateZodSchema: updateInventorySchema,
  getInventoriesZodSchema: getInventoriesSchema,
  getInventoryByIdZodSchema: getInventoryByIdSchema,
  deleteInventoryZodSchema: deleteInventorySchema,
};
