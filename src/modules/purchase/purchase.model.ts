import { model, Schema } from "mongoose";
import {
  IExpenseApplied,
  IPurchase,
  IPurchaseItem,
} from "./purchase.interface";
import { PURCHASE_STATUS_ENUM } from "./purchase.constants";

const purchaseItemSchema = new Schema<IPurchaseItem>(
  {
    variant: { type: Schema.Types.ObjectId, required: true, ref: "Variants" },
    product: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    qty: { type: Number, required: true },
    unit_cost: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    lot_number: { type: String, default: null },
    expiry_date: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const expenseAppliedSchema = new Schema<IExpenseApplied>(
  {
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const purchaseSchema = new Schema<IPurchase>(
  {
    created_by: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    received_by: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    received_at: { type: Date, default: Date.now },

    location: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Location",
    },
    // we need to handle purchase_number more efficiently with separate count/sequence model
    purchase_number: { type: Number, required: true },
    purchase_date: { type: Date, required: true },
    supplier: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Supplier",
    },

    total_cost: { type: Number, default: 0 },
    items: { type: [purchaseItemSchema], required: true },
    expenses_applied: { type: [expenseAppliedSchema], default: [] },
    attachments: { type: [String], default: [] },
    status: {
      type: String,
      enum: Object.values(PURCHASE_STATUS_ENUM),
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PurchaseModel = model<IPurchase>("Purchase", purchaseSchema);
