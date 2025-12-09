import { addressValidationSchema } from "@/common/validators/address.validator";
import z from "zod";

const create = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Name is required" })
        .min(3, "Name must be at least 3 characters"),
      description: z.string().optional(),
      type: z
        .enum(["outlet", "warehouse", "distribution_center"])
        .default("warehouse"),
      address: addressValidationSchema,
    })
    .strict(),
});

export const locationValidations = { create };
