import { Schema, model } from "mongoose";
import { addressSchema } from "@/common/models/address.model";
import { ILocation } from "./location.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const locationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    address: {
      required: true,
      type: addressSchema,
    },
    type: {
      type: String,
      enum: ["outlet", "warehouse", "distribution_center"],
      default: "warehouse",
    },
  },
  schemaOptions
);

export const LocationModel = model<ILocation>("location", locationSchema);
