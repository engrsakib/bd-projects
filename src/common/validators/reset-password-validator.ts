import z from "zod";

export const resetPasswordValidation = z.object({
  body: z
    .object({
      phone_number: z.string({
        required_error: "Phone number must be provided",
      }),
      password: z
        .string({
          required_error: "Password is required",
          invalid_type_error: "Password must be string",
        })
        .min(6, "Password must be at least 6 characters")
        .max(15, "Password must be less than 15 characters"),
    })
    .strict(),
});
