import z from "zod";

export const resendOtp = z.object({
  body: z
    .object({
      phone_number: z.string({
        required_error: "Phone number must be provided",
      }),
    })
    .strict(),
});

const verifyOtp = z.object({
  body: z
    .object({
      phone_number: z.string({
        required_error: "Phone number must be provided",
      }),
      otp: z.number({
        required_error: "Otp must be provided",
        invalid_type_error: "Otp must be number",
      }),
    })
    .strict(),
});

export const otpValidations = { resendOtp, verifyOtp };
