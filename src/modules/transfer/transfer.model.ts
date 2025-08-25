import { Schema, model } from "mongoose";
import { ITransfer } from "./transfer.interface";
import { expenseAppliedSchema } from "../purchase/purchase.model";
import { schemaOptions } from "@/utils/schemaOptions";

const allocationSchema = new Schema({
  lot: { type: Schema.Types.ObjectId, ref: "Lot", required: true },
  qty: { type: Number, required: true }, // এই লট থেকে কত গেছে
  cost_per_unit: { type: Number, required: true }, // লটের unit cost
});

const transferItemSchema = new Schema({
  variant: {
    type: Schema.Types.ObjectId,
    ref: "Variant",
    required: true,
  },
  qty: { type: Number, required: true }, // মোট কত ট্রান্সফার হচ্ছে
  allocations: { type: [allocationSchema], required: true },
});

const transferSchema = new Schema<ITransfer>(
  {
    items: { type: [transferItemSchema], required: true },
    status: { type: String, enum: ["completed"], default: "completed" },
    from: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    transferBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expenses_applied: { type: [expenseAppliedSchema], default: [] },
  },
  schemaOptions
);

export const TransferModel = model<ITransfer>("Transfer", transferSchema);
