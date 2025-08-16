import { zodPhoneNumberValidator } from "@/common/validators/phone-number-validator";
import z from "zod";

const create = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      phone_number: zodPhoneNumberValidator(),
      password: z.string().min(6, "Password must be at least 6 characters"),
      image: z.string().url("Invalid image URL").optional(),
      designation: z.string().optional(),
      bio: z.string().optional(),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      image: z.any().optional(),
      designation: z.string().optional(),
      bio: z.string().optional(),
    })
    .strict(),
});

const approveAccount = z.object({
  body: z.object({
    phone_number: zodPhoneNumberValidator(),
  }),
});

export const adminValidations = {
  create,
  update,
  approveAccount,
};
