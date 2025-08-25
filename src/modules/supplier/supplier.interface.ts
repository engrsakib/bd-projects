import { Document } from "mongoose";

export type ISupplier = {
  name: string;
  contact_id: number; // it will be auto generate if admin don't input here
  address?: string;
  email?: string;
  phone?: string;
  default_payment_terms?: string;
  tax_info?: string;
  notes?: string;
  type: "INDIVIDUAL" | "BUSINESS"; // default is BUSINESS
} & Document;
