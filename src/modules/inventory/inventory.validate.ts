import z from "zod";

const variantSchema = z.object({
  attribute_values: z.record(z.string(), z.string()),
  regular_price: z.number().min(0, "Regular price must be >= 0"),
  sale_price: z.number().min(0, "Sale price must be >= 0"),
  buying_price: z.number().nullable().optional(),
  sku: z.string().min(1, "SKU is required"),
  available_quantity: z
    .number()
    .int()
    .min(0, "Available quantity must be >= 0"),
  total_sold: z.number().int().min(0).default(0),
  image: z.string().url("Image must be a valid URL").optional().default(""),
});

const create = z.object({
  body: z
    .object({
      product: z
        .string({ required_error: "Product ID is required" })
        .min(1, "Product ID is required"),
      attributes: z
        .array(z.string())
        .nonempty("At least one attribute is required"),
      variants: z
        .array(variantSchema)
        .nonempty("At least one variant is required"),
      location: z
        .string({ required_error: "Location ID is required" })
        .min(1, "Location ID is required"),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      attributes: z.array(z.string()).optional(),
    })
    .strict(),
});

export const inventoryValidations = { create, update };
