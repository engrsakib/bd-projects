import { z } from "zod";

export const addressSchema = z.object({
  division: z.string().optional(),
  district: z.string().optional(),
  thana: z.string().optional(),
  zip_code: z.string().optional(),
  local_address: z.string().min(1, "Local address is required"),
});

export const locationSchema = z.object({
  latitude: z.number({ required_error: "Latitude is required" }),
  longitude: z.number({ required_error: "Longitude is required" }),
});

export const createOutletSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
    address: addressSchema,
    location: locationSchema,
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  cookies: z.object({}).optional(),
});

export const updateOutletSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    slug: z.string().optional(),
    address: addressSchema.partial().optional(),
    location: locationSchema.partial().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "Outlet ID is required"),
  }),
  cookies: z.object({}).optional(),
});

export const getOutletsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    search: z.string().optional().default(""),
  }),
  params: z.object({}).optional(),
  cookies: z.object({}).optional(),
});

export const getOutletByIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "Outlet ID is required"),
  }),
  cookies: z.object({}).optional(),
});

export const deleteOutletSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "Outlet ID is required"),
  }),
  cookies: z.object({}).optional(),
});

export const OutletValidationSchema = {
  createZodSchema: createOutletSchema,
  updateZodSchema: updateOutletSchema,
  getOutletsZodSchema: getOutletsSchema,
  getOutletByIdZodSchema: getOutletByIdSchema,
  deleteOutletZodSchema: deleteOutletSchema,
};
