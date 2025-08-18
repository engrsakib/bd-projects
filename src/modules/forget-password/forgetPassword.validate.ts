import z from "zod";

export const forgetPasswordValidation = z.object({
  body: z.object({
    phone_number: z.string({
      required_error: "Phone number must be provided",
    }),
  }),
});
