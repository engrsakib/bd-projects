import z from "zod";

const addToCart = z.object({
  body: z.object({
    product: z.string({ required_error: "Product ID is required" }),
    variant: z.string({ required_error: "Variant ID is required" }),
    attributes: z.record(z.string(), z.string()),
    quantity: z.number({ required_error: "Quantity is required" }).min(1),
    price: z.number({ required_error: "Price is required" }).min(0),
  }),
});

const updateCartItem = z.object({
  params: z.object({
    id: z.string({ required_error: "Item ID is required" }),
  }),
  body: z.object({
    product: z.string().optional(),
    variant: z.string().optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    quantity: z.number().min(1).optional(),
    price: z.number().min(0).optional(),
  }),
});

export const cartValidations = { addToCart, updateCartItem };
