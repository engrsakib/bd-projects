import z from "zod";

export const addressValidationSchema = z
  .object({
    division: z.string().optional(),
    district: z.string().optional(),
    thana: z.string().optional(),
    zip_code: z.string().optional(),
    local_address: z.string().optional(),
    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      const definedProps = Object.values(data).filter((v) => v !== undefined);
      return definedProps.length >= 2;
    },
    { message: "Address must have at least 2 fields defined." }
  );
