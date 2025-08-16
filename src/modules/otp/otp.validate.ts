import { zodPhoneNumberValidator } from "@/common/validators/phone-number-validator";
import z from "zod";

export const resendOtp = z.object({
  body: z
    .object({
      phone_number: zodPhoneNumberValidator(),
    })
    .strict(),
});

const verifyOtp = z.object({
  body: z
    .object({
      phone_number: zodPhoneNumberValidator(),
      otp: z.number({
        required_error: "Otp must be provided",
        invalid_type_error: "Otp must be number",
      }),
    })
    .strict(),
});

export const otpValidations = { resendOtp, verifyOtp };
