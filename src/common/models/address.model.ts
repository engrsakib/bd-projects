import { IAddress } from "@/interfaces/common.interface";
import { Schema } from "mongoose";

export const addressSchema = new Schema<IAddress>(
  {
    division: { type: String, default: "" },
    district: { type: String, default: "" },
    thana: { type: String, default: "" },
    zip_code: { type: String, default: "" },
    local_address: { type: String, default: "" },
    name: { type: String, default: "" },
    phone_number: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);
