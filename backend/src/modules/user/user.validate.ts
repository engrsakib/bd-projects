import z from "zod";
import { USER_ROLES } from "./user.enum";

const create = z.object({
  body: z
    .object({
      name: z
        .string({
          required_error: "Name is required",
          invalid_type_error: "Name must be string/text",
        })
        .min(3, "Name must be at least 3 characters"),
      phone_number: z.string({
        required_error: "Phone number must be provided",
      }),
      email: z
        .string()
        .email({ message: "Please provide a valid email" })
        .optional(),
      password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
        .max(15, "Password must be less than 15 characters"),
      role: z.enum([...USER_ROLES] as [string, ...string[]], {
        required_error: "User role is required",
      }),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      name: z
        .string({
          required_error: "Name is required",
          invalid_type_error: "Name must be string/text",
        })
        .min(3, "Name must be at least 3 characters")
        .optional(),
      image: z.string().optional(),
      phone_number: z
        .string({
          required_error: "Phone number must be provided",
        })
        .optional(),
      email: z
        .string()
        .email({ message: "Please provide a valid email" })
        .optional(),
    })
    .strict(),
});

export const UserValidations = { create, update };
