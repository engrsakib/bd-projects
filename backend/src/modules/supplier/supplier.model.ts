import { model, Schema } from "mongoose";
import { ISupplier } from "./supplier.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const supplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    contact_id: {
      type: Number,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    default_payment_terms: {
      type: String,
      required: false,
    },
    tax_info: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    type: {
      required: true,
      type: String, //"INDIVIDUAL" | "BUSINESS"
      enum: ["INDIVIDUAL", "BUSINESS"],
      default: "BUSINESS",
    },
  },
  schemaOptions
);

export const SupplierModel = model<ISupplier>("Supplier", supplierSchema);
