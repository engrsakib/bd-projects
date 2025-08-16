import z from "zod";
import { CATEGORY_STATUS_ENUM } from "./category.enums";

const create = z.object({
  body: z
    .object({
      name: z.string().min(2).max(100),
      image: z.string().url(),
      serial: z.number().min(0).default(0).optional(),
      status: z
        .enum(Object.values(CATEGORY_STATUS_ENUM) as [string, ...string[]])
        .default(CATEGORY_STATUS_ENUM.PENDING_APPROVAL),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      name: z.string().optional(),
      image: z.string().url().optional(),
      serial: z.number().optional(),
      status: z
        .enum(Object.values(CATEGORY_STATUS_ENUM) as [string, ...string[]])
        .optional(),
    })
    .strict(),
});

const updateStatus = z.object({
  body: z
    .object({
      status: z.enum(
        Object.values(CATEGORY_STATUS_ENUM) as [string, ...string[]],
        { required_error: "Status is required" }
      ),
    })
    .strict(),
});

export const CategoryValidations = {
  create,
  update,
  updateStatus,
};
