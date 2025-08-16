import z from "zod";
import { zodPhoneNumberValidator } from "./phone-number-validator";

export const loginValidation = z.object({
  body: z
    .object({
      phone_number: zodPhoneNumberValidator(),
      password: z.string({
        required_error: "Password must be provided",
      }),
    })
    .strict(),
});
