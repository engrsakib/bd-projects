import { Types } from "mongoose";
import z from "zod";
import { SUBCATEGORY_STATUS_ENUM } from "./subcategory.enums";

const create = z.object({
  body: z
    .object({
      name: z
        .string({
          required_error: "Subcategory name is required",
          invalid_type_error: "Subcategory name must be a string",
        })
        .min(3, "Subcategory name must be at least 3 characters")
        .max(100, "Subcategory name must be less than 100 characters"),

      image: z.string().optional(),
      description: z.string().optional(),
      serial: z
        .number({
          invalid_type_error: "Serial must be a number",
        })
        .int("Serial must be an integer")
        .positive("Serial must be positive")
        .optional(),

      status: z
        .enum(Object.values(SUBCATEGORY_STATUS_ENUM) as [string, ...string[]])
        .default(SUBCATEGORY_STATUS_ENUM.APPROVED)
        .optional(),

      category: z
        .string({
          required_error: "Category ID is required",
          invalid_type_error: "Category ID must be a string",
        })
        .refine((val) => Types.ObjectId.isValid(val), {
          message: "Invalid category ID",
        }),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      name: z
        .string({
          invalid_type_error: "Subcategory name must be a string",
        })
        .optional(),
      image: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      status: z
        .enum(Object.values(SUBCATEGORY_STATUS_ENUM) as [string, ...string[]])
        .default(SUBCATEGORY_STATUS_ENUM.APPROVED)
        .optional(),
      serial: z
        .number({
          invalid_type_error: "Serial must be a number",
        })
        .positive("Serial must be positive")
        .optional(),
    })
    .strict()
    .refine(
      (data) => {
        const values = Object.values(data).filter((v) => v !== undefined);
        return values.length > 0;
      },
      {
        message: "At least one field must be provided",
        path: [],
      }
    ),
});

const updateStatus = z.object({
  body: z
    .object({
      status: z.enum(
        Object.values(SUBCATEGORY_STATUS_ENUM) as [string, ...string[]]
      ),
    })
    .strict(),
});

export const subcategoryValidations = { create, update, updateStatus };
