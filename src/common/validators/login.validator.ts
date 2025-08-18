import z from "zod";

export const loginValidation = z.object({
  body: z
    .object({
      phone_number: z.string({
        required_error: "Phone number must be provided",
      }),
      password: z.string({
        required_error: "Password must be provided",
      }),
    })
    .strict(),
});
