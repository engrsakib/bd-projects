import z from "zod";

const create = z.object({
  body: z.object({}).strict(),
});

export const locationValidations = { create };
