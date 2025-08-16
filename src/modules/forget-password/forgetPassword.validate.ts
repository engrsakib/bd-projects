import { zodPhoneNumberValidator } from "@/common/validators/phone-number-validator";
import z from "zod";

export const forgetPasswordValidation = z.object({
  body: z.object({
    phone_number: zodPhoneNumberValidator(),
  }),
});
