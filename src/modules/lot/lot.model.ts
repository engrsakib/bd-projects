import { model, Schema } from "mongoose";
import { ILot } from "./lot.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const lotsSchema = new Schema<ILot>(
  {
    qty_available: { type: Number, required: true },
    cost_per_unit: { type: Number, required: true },
    received_at: { type: Date, default: Date.now },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    variant: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Locations",
      required: true,
    },
    source: {
      type: {
        type: String,
        enum: ["purchase", "transfer_in", "return", "adjustment"],
        required: true,
      },
      ref_id: {
        type: Schema.Types.ObjectId, // Can reference Purchase, Transfer, etc.
        required: true,
      },
    },
    lot_number: { type: String, required: true },
    expiry_date: { type: Date, default: null },
    qty_total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "quarantined", "closed"],
      default: "active",
    },
    notes: { type: String, default: "" },
    stock: {
      type: Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },
  },
  schemaOptions
);

export const LotModel = model<ILot>("Lot", lotsSchema);
