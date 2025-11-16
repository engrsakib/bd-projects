import { model, Schema, Document } from "mongoose";
import { schemaOptions } from "@/utils/schemaOptions";

// 1. প্রথমে এই স্কিমার জন্য একটি TypeScript Interface তৈরি করুন
export interface IDefaultsPurchase extends Document {
  variant: Schema.Types.ObjectId; // Variant (SKU)
  product: Schema.Types.ObjectId; // Main Product
  supplier?: Schema.Types.ObjectId; // Default Supplier
  unit_cost: number; // Default Cost
  discount?: number; // Default Discount
  tax?: number; // Default Tax
}

// 2. Mongoose Schema-টি ডিফাইন করুন
const defaultsPurchaseSchema = new Schema<IDefaultsPurchase>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
      unique: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    unit_cost: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
  },
  schemaOptions
);

export const DefaultsPurchaseModel = model<IDefaultsPurchase>(
  "DefaultsPurchase",
  defaultsPurchaseSchema
);
