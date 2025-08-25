import { Schema, model } from "mongoose";
import {
  ITransferInventory,
  ITransferInventoryModel,
} from "./transfer.interface";
import { expenseAppliedSchema } from "../purchase/purchase.model";

const stockTransferSchema = new Schema<ITransferInventory>(
  {
    items: [
      {
        variant: {
          type: Schema.Types.ObjectId,
          ref: "Variants",
          required: true,
        },
        qty: { type: Number, required: true }, // মোট কত ট্রান্সফার হচ্ছে
        allocations: [
          {
            lot: { type: Schema.Types.ObjectId, ref: "Lots", required: true },
            qty: { type: Number, required: true }, // এই লট থেকে কত গেছে
            cost_per_unit: { type: Number, required: true }, // লটের unit cost
          },
        ],
      },
    ],
    status: { type: String, enum: ["completed"], default: "completed" },
    from: {
      type: Schema.Types.ObjectId,
      ref: "Business_location",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "Business_location",
      required: true,
    },
    transferBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expenses_applied: { type: [expenseAppliedSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

const StockTransferHistoryModel = model<
  ITransferInventory,
  ITransferInventoryModel
>("StockTransferHistory", stockTransferSchema);

export default StockTransferHistoryModel;
