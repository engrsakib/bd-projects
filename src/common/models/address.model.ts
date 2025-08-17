import { IAddress } from "@/interfaces/common.interface";
import { Schema } from "mongoose";

export const addressSchema = new Schema<IAddress>({
  division: { type: String, default: "" },
  district: { type: String, default: "" },
  thana: { type: String, default: "" },
  zip_code: { type: String, default: "" },
  local_address: { type: String, default: "" },
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
});
