import z from "zod";

const create = z.object({
  body: z
    .object({
      product: z
        .string({ required_error: "Product ID is required" })
        .min(1, "Product ID is required"),
      location: z
        .string({ required_error: "Location ID is required" })
        .min(1, "Location ID is required"),
      variants: z
        .array(z.string())
        .nonempty("At least one variant is required"),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      product: z.string().min(1).optional(),
      location: z.string().min(1).optional(),
      variants: z.array(z.string()).optional(),
    })
    .strict(),
});

export const inventoryValidations = {
  create,
  update,
};
